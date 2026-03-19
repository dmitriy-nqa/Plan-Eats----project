create table public.products (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  display_name text not null,
  normalized_name text not null,
  token_key text not null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_display_name_not_blank check (btrim(display_name) <> ''),
  constraint products_normalized_name_not_blank check (btrim(normalized_name) <> ''),
  constraint products_family_id_id_unique unique (family_id, id),
  constraint products_family_normalized_name_unique unique (family_id, normalized_name)
);

create table public.product_aliases (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  product_id uuid not null,
  alias_name text not null,
  normalized_name text not null,
  token_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_aliases_alias_name_not_blank check (btrim(alias_name) <> ''),
  constraint product_aliases_normalized_name_not_blank check (btrim(normalized_name) <> ''),
  constraint product_aliases_family_product_fk
    foreign key (family_id, product_id)
    references public.products(family_id, id)
    on delete cascade,
  constraint product_aliases_family_normalized_name_unique unique (family_id, normalized_name)
);

alter table public.dish_ingredients
add column product_id uuid references public.products(id) on delete set null;

create or replace function public.ensure_product_name_namespace()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'products' then
    if exists (
      select 1
      from public.product_aliases
      where family_id = new.family_id
        and normalized_name = new.normalized_name
    ) then
      raise exception 'Product name conflicts with an existing alias';
    end if;
  elsif tg_table_name = 'product_aliases' then
    if exists (
      select 1
      from public.products
      where family_id = new.family_id
        and normalized_name = new.normalized_name
    ) then
      raise exception 'Product alias conflicts with an existing canonical product';
    end if;
  end if;

  return new;
end;
$$;

create index idx_products_family_token_key
  on public.products(family_id, token_key);
create index idx_products_family_archived_display_name
  on public.products(family_id, is_archived, display_name);

create index idx_product_aliases_family_token_key
  on public.product_aliases(family_id, token_key);
create index idx_product_aliases_product_id
  on public.product_aliases(product_id);

create index idx_dish_ingredients_product_id
  on public.dish_ingredients(product_id);

create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger set_product_aliases_updated_at
before update on public.product_aliases
for each row execute function public.set_updated_at();

create trigger ensure_products_namespace_before_write
before insert or update of family_id, normalized_name on public.products
for each row execute function public.ensure_product_name_namespace();

create trigger ensure_product_aliases_namespace_before_write
before insert or update of family_id, normalized_name on public.product_aliases
for each row execute function public.ensure_product_name_namespace();
