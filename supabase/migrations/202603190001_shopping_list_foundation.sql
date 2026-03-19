create type shopping_list_adjustment_type_enum as enum ('override', 'suppress');

alter table public.shopping_lists
add column last_synced_at timestamptz,
add column last_source_change_at timestamptz not null default now(),
add column needs_resync boolean not null default true;

update public.shopping_lists
set
  last_synced_at = generated_at,
  last_source_change_at = coalesce(generated_at, updated_at, created_at),
  needs_resync = true;

alter table public.shopping_list_items
add column product_id uuid references public.products(id) on delete set null,
add column source_key text,
add constraint shopping_list_items_source_key_unique unique (shopping_list_id, source_key),
add constraint shopping_list_items_auto_source_key_present check (
  source_type <> 'auto'
  or (source_key is not null and btrim(source_key) <> '')
),
add constraint shopping_list_items_source_key_not_blank check (
  source_key is null or btrim(source_key) <> ''
);

create table public.shopping_list_item_contributions (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  contribution_key text not null,
  source_key text not null,
  day_index integer not null,
  meal_type meal_type_enum not null,
  dish_id uuid not null references public.dishes(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  ingredient_name text not null,
  normalized_name text not null,
  quantity numeric(10,2) not null,
  unit unit_enum not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopping_list_item_contributions_unique unique (shopping_list_id, contribution_key),
  constraint shopping_list_item_contributions_day_index_range check (day_index between 0 and 6),
  constraint shopping_list_item_contributions_key_not_blank check (
    btrim(contribution_key) <> '' and btrim(source_key) <> ''
  ),
  constraint shopping_list_item_contributions_name_not_blank check (btrim(ingredient_name) <> ''),
  constraint shopping_list_item_contributions_normalized_name_not_blank check (
    btrim(normalized_name) <> ''
  ),
  constraint shopping_list_item_contributions_quantity_positive check (quantity > 0)
);

create table public.shopping_list_item_adjustments (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  source_key text not null,
  adjustment_type shopping_list_adjustment_type_enum not null,
  ingredient_name text,
  normalized_name text,
  product_id uuid references public.products(id) on delete set null,
  quantity numeric(10,2),
  unit unit_enum,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopping_list_item_adjustments_unique unique (shopping_list_id, source_key),
  constraint shopping_list_item_adjustments_source_key_not_blank check (btrim(source_key) <> ''),
  constraint shopping_list_item_adjustments_override_payload check (
    (
      adjustment_type = 'suppress'
      and ingredient_name is null
      and normalized_name is null
      and product_id is null
      and quantity is null
      and unit is null
    )
    or
    (
      adjustment_type = 'override'
      and ingredient_name is not null
      and btrim(ingredient_name) <> ''
      and normalized_name is not null
      and btrim(normalized_name) <> ''
      and quantity is not null
      and quantity > 0
      and unit is not null
    )
  )
);

create index idx_shopping_lists_resync
  on public.shopping_lists(needs_resync, last_source_change_at);

create index idx_shopping_list_items_product_id
  on public.shopping_list_items(product_id);

create index idx_shopping_list_items_source_key
  on public.shopping_list_items(shopping_list_id, source_key);

create index idx_shopping_list_item_contributions_source_key
  on public.shopping_list_item_contributions(shopping_list_id, source_key);

create index idx_shopping_list_item_contributions_slot
  on public.shopping_list_item_contributions(shopping_list_id, day_index, meal_type);

create index idx_shopping_list_item_contributions_dish
  on public.shopping_list_item_contributions(dish_id);

create index idx_shopping_list_item_adjustments_source_key
  on public.shopping_list_item_adjustments(shopping_list_id, source_key);

create trigger set_shopping_list_item_contributions_updated_at
before update on public.shopping_list_item_contributions
for each row execute function public.set_updated_at();

create trigger set_shopping_list_item_adjustments_updated_at
before update on public.shopping_list_item_adjustments
for each row execute function public.set_updated_at();
