begin;

alter table public.pont_auction_control
  add column final_ranking uuid[];

-- The existing bid function holds a shared lock on this campaign row.
-- Closing and saving the ranking therefore take effect together.
create function public.pont_capture_auction_ranking()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.final_ranking := array(
    select offer.restaurant_id
    from public.auction_offers offer
    join public.restaurants restaurant on restaurant.id = offer.restaurant_id
    where offer.campaign_month = new.campaign_month and restaurant.enabled
    order by offer.amount desc, offer.created_at asc, offer.restaurant_id asc
  );
  return new;
end;
$$;
revoke execute on function public.pont_capture_auction_ranking() from public, anon, authenticated;

create trigger pont_capture_auction_ranking
before update of is_open on public.pont_auction_control
for each row when (old.is_open and not new.is_open)
execute function public.pont_capture_auction_ranking();

create function public.pont_save_auction_ranking(
  p_month date, p_original uuid[], p_ranking uuid[]
)
returns uuid[]
language plpgsql
security definer set search_path = ''
as $$
declare
  saved uuid[];
begin
  if public.is_super_admin() is not true then
    raise exception 'Acces rezervat contului Super Admin' using errcode = '42501';
  end if;
  if p_original is null or p_ranking is null
    or cardinality(p_ranking) <> (select count(distinct id) from unnest(p_ranking) as entries(id))
    or not (p_ranking <@ p_original) then
    raise exception 'Clasamentul conține poziții nevalide';
  end if;
  update public.pont_auction_control
  set final_ranking = p_ranking
  where campaign_month = p_month and not is_open and final_ranking = p_original
  returning final_ranking into saved;
  if not found then
    raise exception 'Clasamentul s-a schimbat sau licitația este deschisă. Actualizează înainte de salvare.';
  end if;
  return saved;
end;
$$;
revoke execute on function public.pont_save_auction_ranking(date, uuid[], uuid[]) from public, anon, authenticated;
grant execute on function public.pont_save_auction_ranking(date, uuid[], uuid[]) to authenticated;

create function public.pont_public_auction_ranking()
returns table (restaurant_id uuid, rank_position bigint)
language sql stable
security definer set search_path = ''
as $$
  select ranked.id, ranked.ordinality
  from public.pont_auction_control campaign
  cross join lateral unnest(campaign.final_ranking) with ordinality as ranked(id, ordinality)
  join public.restaurants restaurant on restaurant.id = ranked.id and restaurant.enabled
  where campaign.campaign_month = date_trunc('month', now() at time zone 'Europe/Bucharest')::date
    and not campaign.is_open
    and (
      exists (
        select 1 from public.auction_offers offer
        where offer.restaurant_id = ranked.id and offer.campaign_month = campaign.campaign_month
          and offer.payment_status = 'paid'
      )
      or exists (
        select 1 from public.pont_manual_payment_approvals approval
        where approval.restaurant_id = ranked.id and approval.campaign_month = campaign.campaign_month
          and approval.approval_type = 'paid'
      )
    )
  order by ranked.ordinality;
$$;
revoke execute on function public.pont_public_auction_ranking() from public, anon, authenticated;
grant execute on function public.pont_public_auction_ranking() to anon, authenticated;

commit;
