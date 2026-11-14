-- Apply standard order hours when a restaurant has no custom schedule.
alter table public.pont_order_settings
  alter column opens_at set default time '09:00',
  alter column closes_at set default time '15:00';

CREATE OR REPLACE FUNCTION public.pont_finalize_whatsapp_order(p_restaurant_id uuid, p_name text, p_phone text, p_reference text, p_menus integer, p_portions integer, p_items jsonb DEFAULT '[]'::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_name text:=btrim(p_name);
 v_phone text:=regexp_replace(coalesce(p_phone,''),'[^0-9+]','','g');
 v_count integer;
 v_start time;
 v_end time;
 v_min integer:=1;
 v_now time:=(now() at time zone 'Europe/Bucharest')::time;
 v_item jsonb;
 v_dish_id text;
 v_has_snapshots boolean:=false;
begin
 if v_phone ~ '^07[0-9]{8}$' then v_phone:='+4'||v_phone;end if;
 if v_phone ~ '^00407[0-9]{8}$' then v_phone:='+'||substring(v_phone from 3);end if;
 if v_name is null or char_length(v_name) not between 3 and 140
   or v_phone !~ '^\+407[0-9]{8}$'
   or p_reference !~ '^PONT [0-9]{2,12}$'
   or p_menus is null or p_menus not between 1 and 100
   or p_portions is null or p_portions not between 1 and 200 or p_menus>p_portions
   or p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)>12 or pg_column_size(p_items)>4096
   or not exists(select 1 from public.restaurants r where r.id=p_restaurant_id and r.enabled=true)
 then raise exception 'Solicitare invalidă'; end if;
 select opens_at,closes_at,min_full_menus into v_start,v_end,v_min
 from public.pont_order_settings where restaurant_id=p_restaurant_id;
 v_start:=coalesce(v_start,time '09:00');
 v_end:=coalesce(v_end,time '15:00');
 v_min:=coalesce(v_min,1);
 if p_menus<v_min then raise exception 'Comanda minimă este de % meniuri complete.',v_min;end if;
 if v_start is not null and v_end is not null then
  if (v_start<v_end and not (v_now>=v_start and v_now<v_end))
    or (v_start>v_end and not (v_now>=v_start or v_now<v_end))
  then raise exception 'Programul comenzilor este închis.';end if;
 end if;
 if not exists(select 1 from public.menus m where m.restaurant_id=p_restaurant_id and m.service_date=(now() at time zone 'Europe/Bucharest')::date and m.published=true)
 then raise exception 'Meniul zilei nu este disponibil.';end if;
 select exists(
  select 1 from public.menus m
  where m.restaurant_id=p_restaurant_id and m.service_date=(now() at time zone 'Europe/Bucharest')::date and m.published=true
    and m.dish_selection is not null and jsonb_array_length(m.dish_selection)>0
 ) into v_has_snapshots;
 if v_has_snapshots then
  for v_item in select value from jsonb_array_elements(p_items)
  loop
   if jsonb_typeof(v_item->'dish_ids')<>'array' or jsonb_array_length(v_item->'dish_ids') not between 1 and 2
   then raise exception 'Actualizează meniul și selectează din nou preparatele.';end if;
   for v_dish_id in select jsonb_array_elements_text(v_item->'dish_ids')
   loop
    if not exists(
      select 1 from public.menus m, jsonb_array_elements(m.dish_selection) d
      where m.restaurant_id=p_restaurant_id
        and m.service_date=(now() at time zone 'Europe/Bucharest')::date
        and m.published=true and d->>'id'=v_dish_id
        and coalesce(d->>'available','true')='true'
    ) then raise exception 'Un preparat este epuizat. Actualizează meniul.';end if;
   end loop;
  end loop;
 end if;
 if (select count(*) from public.pont_customer_order_leads l where l.customer_phone=v_phone and l.started_at>now()-interval '24 hours')>=20
 then raise exception 'Prea multe solicitări. Reîncearcă mai târziu.';end if;
 insert into public.pont_customer_order_leads(restaurant_id,customer_name,customer_phone,order_reference,menus_count,portions_count,items)
 values(p_restaurant_id,v_name,v_phone,p_reference,p_menus,p_portions,p_items)
 on conflict(order_reference) do nothing;
 get diagnostics v_count=row_count;
 if v_count>0 then
  insert into public.pont_restaurant_events(restaurant_id,event_type,menus_count,portions_count)
  values(p_restaurant_id,'whatsapp_open',p_menus,p_portions);
 end if;
 return v_count>0;
end $function$;
