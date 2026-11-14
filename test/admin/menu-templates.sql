begin;

create table public.pont_menu_templates (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  dish_ids uuid[] not null check (cardinality(dish_ids) between 1 and 60)
);

create index pont_menu_templates_restaurant on public.pont_menu_templates (restaurant_id, name);
alter table public.pont_menu_templates enable row level security;
revoke all on public.pont_menu_templates from public, anon, authenticated;
grant select, insert, update, delete on public.pont_menu_templates to authenticated;
create policy pont_menu_templates_manage on public.pont_menu_templates
  for all to authenticated
  using (public.can_manage_restaurant(restaurant_id))
  with check (public.can_manage_restaurant(restaurant_id));

create function public.pont_publish_menu_template(p_template uuid, p_date date)
returns uuid
language plpgsql
security invoker set search_path = ''
as $$
declare
  model public.pont_menu_templates;
  menu_price numeric;
  items jsonb;
  first_dish jsonb;
  second_dish jsonb;
  dessert_dish jsonb;
  menu_id uuid;
begin
  if p_date is null or p_date < (now() at time zone 'Europe/Bucharest')::date then
    raise exception 'Alege data de azi sau o dată viitoare.';
  end if;

  select * into model from public.pont_menu_templates where id = p_template for share;
  if not found then
    raise exception 'Modelul nu este disponibil.';
  end if;

  select restaurant.menu_price into menu_price
  from public.restaurants restaurant
  where restaurant.id = model.restaurant_id and restaurant.enabled;
  if not found then
    raise exception 'Restaurantul nu este activ.';
  end if;
  if menu_price is null or menu_price <= 0 or menu_price > 10000 then
    raise exception 'Configurează mai întâi prețul standard al meniului.';
  end if;

  select jsonb_agg(jsonb_build_object(
    'id', dish.id, 'category', dish.category, 'name', dish.name,
    'description', dish.description, 'price', case when dish.category = 'dessert' then 0 else dish.price end,
    'available', dish.available
  ) order by chosen.ordinality)
  into items
  from unnest(model.dish_ids) with ordinality as chosen(id, ordinality)
  join public.pont_dishes dish on dish.id = chosen.id and dish.restaurant_id = model.restaurant_id;

  if coalesce(jsonb_array_length(items), 0) <> cardinality(model.dish_ids)
     or cardinality(model.dish_ids) <> (select count(distinct id) from unnest(model.dish_ids) as dishes(id)) then
    raise exception 'Modelul conține preparate care nu mai sunt disponibile în bibliotecă. Editează modelul.';
  end if;
  if not exists (select 1 from jsonb_array_elements(items) as item where item->>'available' = 'true') then
    raise exception 'Toate preparatele selectate sunt epuizate. Verifică disponibilitatea.';
  end if;

  select item into first_dish from jsonb_array_elements(items) as item where item->>'category' = 'first' limit 1;
  select item into second_dish from jsonb_array_elements(items) as item where item->>'category' = 'second' limit 1;
  select item into dessert_dish from jsonb_array_elements(items) as item where item->>'category' = 'dessert' limit 1;

  insert into public.menus (
    restaurant_id, title, service_date, price, published,
    first_course, first_price, second_course, second_price, dessert, dish_selection
  ) values (
    model.restaurant_id, 'Meniul zilei', p_date, menu_price, true,
    coalesce(first_dish->>'name', ''), (first_dish->>'price')::numeric,
    coalesce(second_dish->>'name', ''), (second_dish->>'price')::numeric,
    coalesce(dessert_dish->>'name', ''), items
  ) returning id into menu_id;
  return menu_id;
exception
  when unique_violation then
    raise exception 'Există deja un meniu publicat pentru restaurant la data aleasă.';
end;
$$;
revoke execute on function public.pont_publish_menu_template(uuid,date) from public, anon, authenticated;
grant execute on function public.pont_publish_menu_template(uuid,date) to authenticated;

commit;
