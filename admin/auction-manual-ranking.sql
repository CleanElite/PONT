begin;

create or replace function public.pont_capture_auction_ranking()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  winners uuid[];
begin
  winners := array(
    select offer.restaurant_id
    from public.auction_offers offer
    join public.restaurants restaurant on restaurant.id = offer.restaurant_id
    where offer.campaign_month = new.campaign_month and restaurant.enabled
    order by offer.amount desc, offer.bid_rank_at asc nulls last, offer.created_at asc, offer.restaurant_id asc
  );
  new.final_ranking := winners || array(
    select manual.id
    from unnest(old.final_ranking) with ordinality as manual(id, ordinal)
    join public.restaurants restaurant on restaurant.id = manual.id and restaurant.enabled
    where not (manual.id = any(winners))
      and public.pont_restaurant_month_paid(manual.id, new.campaign_month)
    order by manual.ordinal
  );
  return new;
end;
$$;

create or replace function public.pont_save_auction_ranking(
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
  if p_month is null or extract(day from p_month) <> 1 or p_ranking is null
    or cardinality(p_ranking) <> (select count(distinct id) from unnest(p_ranking) as entries(id))
    or exists (
      select 1 from unnest(p_ranking) as entries(id)
      where not coalesce(id = any(p_original), false)
        and not exists (
          select 1 from public.restaurants restaurant
          where restaurant.id = entries.id and restaurant.enabled
            and public.pont_restaurant_month_paid(restaurant.id, p_month)
        )
    ) then
    raise exception 'Poți adăuga doar restaurante active, autorizate pentru luna aleasă.';
  end if;

  if p_original is null then
    insert into public.pont_auction_control as campaign (campaign_month, is_open, final_ranking)
    values (p_month, false, p_ranking)
    on conflict (campaign_month) do update set final_ranking = excluded.final_ranking
    where not campaign.is_open and campaign.final_ranking is null
    returning final_ranking into saved;
  else
    update public.pont_auction_control
    set final_ranking = p_ranking
    where campaign_month = p_month and not is_open and final_ranking = p_original
    returning final_ranking into saved;
  end if;
  if not found then
    raise exception 'Clasamentul s-a schimbat sau licitația este deschisă. Actualizează înainte de salvare.';
  end if;
  return saved;
end;
$$;

create or replace function public.pont_public_auction_ranking()
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
    and public.pont_restaurant_month_paid(ranked.id, campaign.campaign_month)
  order by ranked.ordinality;
$$;

commit;
