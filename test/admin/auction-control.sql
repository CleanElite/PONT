-- Manual opening of the next month's promotion auction.
create table public.pont_auction_control (
  campaign_month date primary key check (extract(day from campaign_month) = 1),
  is_open boolean not null default false
);

alter table public.pont_auction_control enable row level security;
revoke all on public.pont_auction_control from public, anon, authenticated;
grant select, insert, update on public.pont_auction_control to authenticated;

create policy pont_auction_control_read on public.pont_auction_control
  for select to authenticated using (true);
create policy pont_auction_control_insert on public.pont_auction_control
  for insert to authenticated with check (
    (select public.is_super_admin()) and
    campaign_month = (date_trunc('month', now() at time zone 'Europe/Bucharest') + interval '1 month')::date
  );
create policy pont_auction_control_update on public.pont_auction_control
  for update to authenticated using (
    (select public.is_super_admin()) and
    campaign_month = (date_trunc('month', now() at time zone 'Europe/Bucharest') + interval '1 month')::date
  ) with check (
    (select public.is_super_admin()) and
    campaign_month = (date_trunc('month', now() at time zone 'Europe/Bucharest') + interval '1 month')::date
  );

CREATE OR REPLACE FUNCTION public.place_my_auction_bid(p_month date, p_amount numeric)
 RETURNS auction_offers
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare rid uuid; existing public.auction_offers; result public.auction_offers; today_ro date; bid_round int;
begin
 select rm.restaurant_id into rid from public.restaurant_members rm where rm.user_id=auth.uid() order by rm.restaurant_id limit 1;
 if rid is null then raise exception 'Nu ai un restaurant atribuit'; end if;
 today_ro=(now() at time zone 'Europe/Bucharest')::date;
 if p_month is null or p_month<>(date_trunc('month',today_ro)+interval '1 month')::date then raise exception 'Se pot depune oferte doar pentru luna următoare';end if;
 -- Serialize closing the campaign with offers already in progress.
 perform 1 from public.pont_auction_control
  where campaign_month = p_month and is_open
  for share;
 if not found then raise exception 'Licitația este închisă'; end if;
 if extract(day from today_ro) in (22,23) then bid_round=1;
 elsif extract(day from today_ro) in (26,27) then bid_round=2;
 elsif extract(day from today_ro)=29 then bid_round=3;
 else bid_round=1; end if;
 if p_amount is null or p_amount<50 or p_amount<>trunc(p_amount) then raise exception 'Oferta trebuie să fie de minimum 50 lei, în lei întregi';end if;
 select * into existing from public.auction_offers where restaurant_id=rid and campaign_month=p_month for update;
 if found then
  if existing.payment_status='paid' then raise exception 'Oferta a fost deja achitată';end if;
  if p_amount<existing.amount+10 then raise exception 'Majorarea minimă este de 10 lei';end if;
  update public.auction_offers set amount=p_amount,round=greatest(existing.round,bid_round),payment_status='pending',paid_at=null,updated_at=now() where id=existing.id returning * into result;
 else
  insert into public.auction_offers(restaurant_id,campaign_month,amount,round) values(rid,p_month,p_amount,bid_round) returning * into result;
 end if;
 return result;
end $function$;
