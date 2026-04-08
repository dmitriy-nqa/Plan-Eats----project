create or replace function public.record_meal_plan_source_change(
  target_meal_plan_id uuid
)
returns table (
  shopping_list_id uuid,
  source_version bigint,
  freshness_state text
)
language plpgsql
as $$
declare
  next_source_version bigint;
  next_shopping_list_id uuid;
  next_freshness_state text;
  source_change_at timestamptz := now();
begin
  update public.meal_plans as meal_plan
  set source_version = meal_plan.source_version + 1
  where meal_plan.id = target_meal_plan_id
  returning meal_plan.source_version into next_source_version;

  if next_source_version is null then
    raise exception 'Meal plan % was not found for source-change bookkeeping.', target_meal_plan_id
      using errcode = 'P0002';
  end if;

  insert into public.shopping_lists (
    meal_plan_id,
    last_source_change_at,
    needs_resync,
    freshness_state,
    recompute_requested_at,
    claim_token,
    claim_target_version,
    claim_expires_at
  )
  values (
    target_meal_plan_id,
    source_change_at,
    true,
    'no_projection',
    source_change_at,
    null,
    null,
    null
  )
  on conflict (meal_plan_id) do nothing;

  update public.shopping_lists
  set
    last_source_change_at = source_change_at,
    needs_resync = true,
    freshness_state = case
      when published_source_version is null then 'no_projection'
      else 'stale_pending'
    end,
    recompute_requested_at = source_change_at,
    claim_token = null,
    claim_target_version = null,
    claim_expires_at = null
  where meal_plan_id = target_meal_plan_id
  returning shopping_lists.id, shopping_lists.freshness_state
  into next_shopping_list_id, next_freshness_state;

  if next_shopping_list_id is null then
    raise exception 'Shopping list header could not be prepared for meal plan %.', target_meal_plan_id
      using errcode = 'P0002';
  end if;

  return query
  select next_shopping_list_id, next_source_version, next_freshness_state;
end;
$$;

comment on function public.record_meal_plan_source_change(uuid) is
  'Collapses the shared Weekly Menu source-change bookkeeping tail into one DB-side boundary: ensure shopping-list header existence, bump meal_plans.source_version monotonically, mark shopping_lists stale/requested, and clear any live claim.';
