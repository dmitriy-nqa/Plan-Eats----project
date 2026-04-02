alter table public.meal_plans
add column source_version bigint not null default 0,
add constraint meal_plans_source_version_non_negative check (source_version >= 0);

comment on column public.meal_plans.source_version is
  'Phase 1 authority column: latest committed shopping-relevant source version for this meal plan. This is the only authoritative latest-target version going forward.';

create or replace function public.bump_meal_plan_source_version(target_meal_plan_id uuid)
returns bigint
language plpgsql
as $$
declare
  next_source_version bigint;
begin
  update public.meal_plans
  set source_version = source_version + 1
  where id = target_meal_plan_id
  returning source_version into next_source_version;

  if next_source_version is null then
    raise exception 'Meal plan % was not found for source-version bump.', target_meal_plan_id
      using errcode = 'P0002';
  end if;

  return next_source_version;
end;
$$;

comment on function public.bump_meal_plan_source_version(uuid) is
  'Phase 1 helper for atomically advancing meal_plans.source_version while the legacy synchronous shopping-list recompute path is still active.';

alter table public.shopping_lists
add column published_source_version bigint,
add column freshness_state text not null default 'no_projection',
add column recompute_requested_at timestamptz,
add column claim_token uuid,
add column claim_target_version bigint,
add column claim_expires_at timestamptz,
add column last_failure_at timestamptz,
add column last_failure_source_version bigint,
add column last_failure_reason text,
add constraint shopping_lists_freshness_state_valid
  check (
    freshness_state in (
      'no_projection',
      'fresh',
      'stale_pending',
      'updating',
      'failed_latest'
    )
  ),
add constraint shopping_lists_published_source_version_non_negative
  check (published_source_version is null or published_source_version >= 0),
add constraint shopping_lists_claim_target_version_non_negative
  check (claim_target_version is null or claim_target_version >= 0),
add constraint shopping_lists_last_failure_source_version_non_negative
  check (last_failure_source_version is null or last_failure_source_version >= 0),
add constraint shopping_lists_claim_fields_coherent
  check (
    (
      claim_token is null
      and claim_target_version is null
      and claim_expires_at is null
    )
    or
    (
      claim_token is not null
      and claim_target_version is not null
      and claim_expires_at is not null
    )
  ),
add constraint shopping_lists_last_failure_reason_not_blank
  check (last_failure_reason is null or btrim(last_failure_reason) <> '');

comment on table public.shopping_lists is
  'Shopping-list header plus a Phase 1 co-located recompute-control submodel. The control-plane columns are stored here for rollout safety only and should not turn shopping_lists into a permanent god-row.';

comment on column public.shopping_lists.published_source_version is
  'Phase 1 control-plane column: latest published shopping baseline version. Baseline existence is determined only by this column being non-null.';

comment on column public.shopping_lists.freshness_state is
  'Phase 1 control-plane column: logical freshness of the derived shopping projection using the locked Phase 1 states (no_projection, fresh, stale_pending, updating, failed_latest). Co-located on shopping_lists for rollout safety, but logically separate from shopping payload data.';

comment on column public.shopping_lists.recompute_requested_at is
  'Phase 1 control-plane column: discovery and ordering aid only. This timestamp is not durable recompute intent by itself.';

comment on column public.shopping_lists.claim_token is
  'Phase 1 control-plane lease token placeholder. Lease claiming is intentionally not active in Slice 1.';

comment on column public.shopping_lists.claim_target_version is
  'Phase 1 control-plane lease target placeholder. Visible auto rows must later advance only through guarded publish to this target version.';

comment on column public.shopping_lists.claim_expires_at is
  'Phase 1 control-plane lease expiry placeholder. Lease behavior is intentionally not active in Slice 1.';

comment on column public.shopping_lists.last_failure_at is
  'Phase 1 control-plane field capturing the latest recompute failure timestamp once executor behavior is introduced.';

comment on column public.shopping_lists.last_failure_source_version is
  'Phase 1 control-plane field capturing the source_version associated with the latest recompute failure once executor behavior is introduced.';

comment on column public.shopping_lists.last_failure_reason is
  'Phase 1 control-plane field capturing the latest recompute failure reason once executor behavior is introduced.';
