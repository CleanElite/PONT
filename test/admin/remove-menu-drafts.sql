begin;
lock table public.menus in share row exclusive mode;
delete from public.menus where published is false;
alter table public.menus
  alter column published drop default,
  add constraint pont_menus_require_publication check (published is true);
commit;
