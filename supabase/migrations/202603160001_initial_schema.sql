create extension if not exists pgcrypto;

create type meal_type_enum as enum ('breakfast', 'lunch', 'dinner');
create type unit_enum as enum ('g', 'ml', 'l', 'pcs');
create type dish_category_enum as enum ('breakfast', 'soup', 'salad', 'main_course', 'bakery_and_desserts');
create type family_member_status_enum as enum ('active');
create type shopping_item_source_enum as enum ('auto', 'manual');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_not_blank check (
    display_name is null or btrim(display_name) <> ''
  )
);

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint families_name_not_blank check (btrim(name) <> '')
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status family_member_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  constraint family_members_family_user_unique unique (family_id, user_id)
);

create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  category dish_category_enum not null,
  comment text,
  recipe_text text,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dishes_name_not_blank check (btrim(name) <> ''),
  constraint dishes_family_id_id_unique unique (family_id, id)
);

create table public.dish_ingredients (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes(id) on delete cascade,
  ingredient_name text not null,
  quantity numeric(10,2) not null,
  unit unit_enum not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dish_ingredients_name_not_blank check (btrim(ingredient_name) <> ''),
  constraint dish_ingredients_quantity_positive check (quantity > 0),
  constraint dish_ingredients_sort_order_non_negative check (sort_order >= 0)
);

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_plans_family_start_unique unique (family_id, start_date),
  constraint meal_plans_start_is_monday check (extract(isodow from start_date) = 1),
  constraint meal_plans_is_seven_days check (end_date = start_date + 6),
  constraint meal_plans_family_id_id_unique unique (family_id, id)
);

create table public.meal_plan_slots (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  meal_plan_id uuid not null,
  day_index integer not null,
  meal_type meal_type_enum not null,
  dish_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_plan_slots_meal_plan_family_fk
    foreign key (family_id, meal_plan_id)
    references public.meal_plans(family_id, id)
    on delete cascade,
  constraint meal_plan_slots_dish_family_fk
    foreign key (family_id, dish_id)
    references public.dishes(family_id, id)
    on delete restrict,
  constraint meal_plan_slots_day_index_range check (day_index between 0 and 6),
  constraint meal_plan_slots_unique_slot unique (meal_plan_id, day_index, meal_type)
);

create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null unique references public.meal_plans(id) on delete cascade,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  ingredient_name text not null,
  normalized_name text,
  quantity numeric(10,2) not null,
  unit unit_enum not null,
  source_type shopping_item_source_enum not null,
  is_checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopping_list_items_name_not_blank check (btrim(ingredient_name) <> ''),
  constraint shopping_list_items_quantity_positive check (quantity > 0),
  constraint shopping_list_items_normalized_name_not_blank check (
    normalized_name is null or btrim(normalized_name) <> ''
  )
);

create table public.ingredient_synonyms (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  raw_name text not null,
  raw_name_normalized text generated always as (lower(btrim(raw_name))) stored,
  canonical_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingredient_synonyms_raw_name_not_blank check (btrim(raw_name) <> ''),
  constraint ingredient_synonyms_canonical_name_not_blank check (btrim(canonical_name) <> ''),
  constraint ingredient_synonyms_family_raw_normalized_unique unique (family_id, raw_name_normalized)
);

create index idx_family_members_user_id on public.family_members(user_id);

create index idx_dishes_family_active_name
  on public.dishes(family_id, is_archived, name);
create index idx_dishes_created_by_user_id on public.dishes(created_by_user_id);

create index idx_dish_ingredients_dish_sort_order
  on public.dish_ingredients(dish_id, sort_order);

create index idx_meal_plans_family_start_date
  on public.meal_plans(family_id, start_date);

create index idx_meal_plan_slots_meal_plan_day
  on public.meal_plan_slots(meal_plan_id, day_index);
create index idx_meal_plan_slots_dish_id
  on public.meal_plan_slots(dish_id);

create index idx_shopping_list_items_list_source_checked
  on public.shopping_list_items(shopping_list_id, source_type, is_checked);
create index idx_shopping_list_items_normalized_name
  on public.shopping_list_items(shopping_list_id, normalized_name, unit);

create index idx_ingredient_synonyms_family_canonical
  on public.ingredient_synonyms(family_id, canonical_name);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_families_updated_at
before update on public.families
for each row execute function public.set_updated_at();

create trigger set_dishes_updated_at
before update on public.dishes
for each row execute function public.set_updated_at();

create trigger set_dish_ingredients_updated_at
before update on public.dish_ingredients
for each row execute function public.set_updated_at();

create trigger set_meal_plans_updated_at
before update on public.meal_plans
for each row execute function public.set_updated_at();

create trigger set_meal_plan_slots_updated_at
before update on public.meal_plan_slots
for each row execute function public.set_updated_at();

create trigger set_shopping_lists_updated_at
before update on public.shopping_lists
for each row execute function public.set_updated_at();

create trigger set_shopping_list_items_updated_at
before update on public.shopping_list_items
for each row execute function public.set_updated_at();

create trigger set_ingredient_synonyms_updated_at
before update on public.ingredient_synonyms
for each row execute function public.set_updated_at();
