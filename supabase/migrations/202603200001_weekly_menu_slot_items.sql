create table public.meal_plan_slot_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  slot_id uuid not null references public.meal_plan_slots(id) on delete cascade,
  dish_id uuid not null references public.dishes(id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_plan_slot_items_sort_order_non_negative check (sort_order >= 0),
  constraint meal_plan_slot_items_unique_order unique (slot_id, sort_order),
  constraint meal_plan_slot_items_unique_dish unique (slot_id, dish_id)
);

insert into public.meal_plan_slot_items (family_id, slot_id, dish_id, sort_order)
select
  slot.family_id,
  slot.id,
  slot.dish_id,
  0
from public.meal_plan_slots as slot
where not exists (
  select 1
  from public.meal_plan_slot_items as item
  where item.slot_id = slot.id
);

create index idx_meal_plan_slot_items_slot_id
  on public.meal_plan_slot_items(slot_id, sort_order);

create index idx_meal_plan_slot_items_dish_id
  on public.meal_plan_slot_items(dish_id);

create trigger set_meal_plan_slot_items_updated_at
before update on public.meal_plan_slot_items
for each row execute function public.set_updated_at();
