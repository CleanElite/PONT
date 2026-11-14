-- PONT multi-tenant schema for Supabase PostgreSQL
create extension if not exists pgcrypto;
create table if not exists public.restaurants (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 slug text unique not null,
 enabled boolean not null default true,
 managed_by_pont boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'restaurant' check(role in ('super_admin','restaurant')),
 created_at timestamptz not null default now()
);
create table if not exists public.restaurant_members (
 user_id uuid not null references auth.users(id) on delete cascade,
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 primary key(user_id,restaurant_id)
);
create table if not exists public.menus (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 title text not null,
 service_date date not null,
 price numeric(10,2) check(price is null or price>=0),
 description text not null default '',
 published boolean not null default false,
 expires_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists menus_restaurant_date_idx on public.menus(restaurant_id,service_date);
create or replace function public.is_super_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where user_id=(select auth.uid()) and role='super_admin')
$$;
create or replace function public.can_manage_restaurant(rid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.is_super_admin() or exists(select 1 from public.restaurant_members where user_id=(select auth.uid()) and restaurant_id=rid)
$$;
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.menus enable row level security;
create policy "profiles own or admin read" on public.profiles for select to authenticated using(user_id=(select auth.uid()) or public.is_super_admin());
create policy "admins manage profiles" on public.profiles for all to authenticated using(public.is_super_admin()) with check(public.is_super_admin());
create policy "restaurants public read enabled" on public.restaurants for select to anon,authenticated using(enabled or public.can_manage_restaurant(id));
create policy "admins manage restaurants" on public.restaurants for all to authenticated using(public.is_super_admin()) with check(public.is_super_admin());
create policy "members read own or admin" on public.restaurant_members for select to authenticated using(user_id=(select auth.uid()) or public.is_super_admin());
create policy "admins manage members" on public.restaurant_members for all to authenticated using(public.is_super_admin()) with check(public.is_super_admin());
create policy "public read published menus" on public.menus for select to anon,authenticated using((published and service_date=current_date and (expires_at is null or expires_at>now()) and exists(select 1 from public.restaurants r where r.id=restaurant_id and r.enabled)) or public.can_manage_restaurant(restaurant_id));
create policy "authorized insert menus" on public.menus for insert to authenticated with check(public.can_manage_restaurant(restaurant_id));
create policy "authorized update menus" on public.menus for update to authenticated using(public.can_manage_restaurant(restaurant_id)) with check(public.can_manage_restaurant(restaurant_id));
create policy "authorized delete menus" on public.menus for delete to authenticated using(public.can_manage_restaurant(restaurant_id));
-- First super admin must be assigned by a trusted database operator, never by client-side code:
-- insert into public.profiles(user_id,role) values ('YOUR_AUTH_USER_UUID','super_admin');
