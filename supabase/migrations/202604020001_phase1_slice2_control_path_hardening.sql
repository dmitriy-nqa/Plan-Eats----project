create or replace function public.claim_shopping_list_recompute(
  target_shopping_list_id uuid,
  next_claim_token uuid,
  next_claim_expires_at timestamptz
)
returns table (
  claimed boolean,
  claim_target_version bigint
)
language plpgsql
as $$
declare
  shopping_list_row record;
begin
  select
    sl.*,
    mp.source_version as current_source_version
  into shopping_list_row
  from public.shopping_lists sl
  join public.meal_plans mp
    on mp.id = sl.meal_plan_id
  where sl.id = target_shopping_list_id
  for update;

  if not found then
    raise exception 'Shopping list % was not found for recompute claim.', target_shopping_list_id
      using errcode = 'P0002';
  end if;

  if (
    shopping_list_row.claim_token is not null
    and shopping_list_row.claim_expires_at is not null
    and shopping_list_row.claim_expires_at > now()
  ) then
    return query
    select false, shopping_list_row.claim_target_version::bigint;
    return;
  end if;

  if (
    shopping_list_row.published_source_version is not null
    and shopping_list_row.published_source_version >= shopping_list_row.current_source_version
  ) then
    update public.shopping_lists
    set
      freshness_state = 'fresh',
      recompute_requested_at = null,
      claim_token = null,
      claim_target_version = null,
      claim_expires_at = null
    where id = target_shopping_list_id;

    return query
    select false, shopping_list_row.current_source_version::bigint;
    return;
  end if;

  update public.shopping_lists
  set
    claim_token = next_claim_token,
    claim_target_version = shopping_list_row.current_source_version,
    claim_expires_at = next_claim_expires_at,
    freshness_state = 'updating'
  where id = target_shopping_list_id;

  return query
  select true, shopping_list_row.current_source_version::bigint;
end;
$$;

comment on function public.claim_shopping_list_recompute(uuid, uuid, timestamptz) is
  'Phase 1 Slice 2: best-effort lease claim for shopping recompute. updating means a live claimed lease only.';

create or replace function public.guarded_publish_shopping_list_projection(
  target_shopping_list_id uuid,
  expected_claim_token uuid,
  expected_claim_target_version bigint,
  published_at timestamptz,
  next_contributions jsonb
)
returns boolean
language plpgsql
as $$
declare
  shopping_list_row record;
begin
  select
    sl.*,
    mp.source_version as current_source_version
  into shopping_list_row
  from public.shopping_lists sl
  join public.meal_plans mp
    on mp.id = sl.meal_plan_id
  where sl.id = target_shopping_list_id
  for update;

  if not found then
    raise exception 'Shopping list % was not found for guarded publish.', target_shopping_list_id
      using errcode = 'P0002';
  end if;

  if (
    shopping_list_row.claim_token is distinct from expected_claim_token
    or shopping_list_row.claim_target_version is distinct from expected_claim_target_version
    or shopping_list_row.claim_expires_at is null
    or shopping_list_row.claim_expires_at <= now()
    or shopping_list_row.current_source_version is distinct from expected_claim_target_version
    or (
      shopping_list_row.published_source_version is not null
      and shopping_list_row.published_source_version >= expected_claim_target_version
    )
  ) then
    return false;
  end if;

  create temporary table if not exists temp_guarded_publish_contributions (
    shopping_list_id uuid not null,
    meal_plan_id uuid not null,
    contribution_key text not null,
    source_key text not null,
    day_index integer not null,
    meal_type public.meal_type_enum not null,
    dish_id uuid not null,
    product_id uuid null,
    ingredient_name text not null,
    normalized_name text not null,
    quantity numeric not null,
    unit public.unit_enum not null
  ) on commit drop;

  truncate temp_guarded_publish_contributions;

  insert into temp_guarded_publish_contributions (
    shopping_list_id,
    meal_plan_id,
    contribution_key,
    source_key,
    day_index,
    meal_type,
    dish_id,
    product_id,
    ingredient_name,
    normalized_name,
    quantity,
    unit
  )
  select
    target_shopping_list_id,
    (payload->>'meal_plan_id')::uuid,
    payload->>'contribution_key',
    payload->>'source_key',
    (payload->>'day_index')::integer,
    (payload->>'meal_type')::public.meal_type_enum,
    (payload->>'dish_id')::uuid,
    nullif(payload->>'product_id', '')::uuid,
    payload->>'ingredient_name',
    payload->>'normalized_name',
    (payload->>'quantity')::numeric,
    (payload->>'unit')::public.unit_enum
  from jsonb_array_elements(coalesce(next_contributions, '[]'::jsonb)) as payload;

  create temporary table if not exists temp_guarded_publish_existing_auto_items (
    source_key text primary key,
    is_checked boolean not null
  ) on commit drop;

  truncate temp_guarded_publish_existing_auto_items;

  insert into temp_guarded_publish_existing_auto_items (source_key, is_checked)
  select source_key, is_checked
  from public.shopping_list_items
  where shopping_list_id = target_shopping_list_id
    and source_type = 'auto'
    and source_key is not null;

  delete from public.shopping_list_item_contributions
  where shopping_list_id = target_shopping_list_id;

  insert into public.shopping_list_item_contributions (
    shopping_list_id,
    meal_plan_id,
    contribution_key,
    source_key,
    day_index,
    meal_type,
    dish_id,
    product_id,
    ingredient_name,
    normalized_name,
    quantity,
    unit
  )
  select
    shopping_list_id,
    meal_plan_id,
    contribution_key,
    source_key,
    day_index,
    meal_type,
    dish_id,
    product_id,
    ingredient_name,
    normalized_name,
    quantity,
    unit
  from temp_guarded_publish_contributions;

  delete from public.shopping_list_items
  where shopping_list_id = target_shopping_list_id
    and source_type = 'auto';

  insert into public.shopping_list_items (
    shopping_list_id,
    ingredient_name,
    normalized_name,
    quantity,
    unit,
    source_type,
    is_checked,
    product_id,
    source_key
  )
  with grouped_contributions as (
    select
      contribution.source_key,
      min(contribution.ingredient_name) as ingredient_name,
      min(contribution.normalized_name) as normalized_name,
      sum(contribution.quantity) as quantity,
      min(contribution.unit) as unit,
      min(contribution.product_id::text)::uuid as product_id
    from temp_guarded_publish_contributions contribution
    group by contribution.source_key
  )
  select
    target_shopping_list_id,
    case
      when adjustment.adjustment_type = 'override' and adjustment.ingredient_name is not null
        then adjustment.ingredient_name
      else grouped.ingredient_name
    end,
    case
      when adjustment.adjustment_type = 'override' and adjustment.normalized_name is not null
        then adjustment.normalized_name
      else grouped.normalized_name
    end,
    case
      when adjustment.adjustment_type = 'override'
        and adjustment.quantity is not null
        and adjustment.quantity > 0
        then adjustment.quantity
      else grouped.quantity
    end,
    case
      when adjustment.adjustment_type = 'override' and adjustment.unit is not null
        then adjustment.unit
      else grouped.unit
    end,
    'auto',
    coalesce(existing_auto.is_checked, false),
    case
      when adjustment.adjustment_type = 'override'
        then adjustment.product_id
      else grouped.product_id
    end,
    grouped.source_key
  from grouped_contributions grouped
  left join public.shopping_list_item_adjustments adjustment
    on adjustment.shopping_list_id = target_shopping_list_id
    and adjustment.source_key = grouped.source_key
  left join temp_guarded_publish_existing_auto_items existing_auto
    on existing_auto.source_key = grouped.source_key
  where adjustment.adjustment_type is distinct from 'suppress';

  update public.shopping_lists
  set
    generated_at = published_at,
    last_synced_at = published_at,
    needs_resync = false,
    published_source_version = expected_claim_target_version,
    freshness_state = 'fresh',
    recompute_requested_at = null,
    claim_token = null,
    claim_target_version = null,
    claim_expires_at = null,
    last_failure_at = null,
    last_failure_source_version = null,
    last_failure_reason = null
  where id = target_shopping_list_id;

  return true;
end;
$$;

comment on function public.guarded_publish_shopping_list_projection(uuid, uuid, bigint, timestamptz, jsonb) is
  'Phase 1 Slice 2: guarded publish finalizer. Commits the published base plus continuity-applied visible auto rows under one guarded baseline-authority boundary.';
