insert into public.profiles (id, email)
select auth_user.id, auth_user.email
from auth.users as auth_user
left join public.profiles as profile
  on profile.id = auth_user.id
where profile.id is null
  and auth_user.email is not null;

alter table public.applications
  add column if not exists salary integer;

alter table public.applications
  add column if not exists rating integer check (rating between 1 and 5);

alter table public.applications
  drop constraint if exists applications_result_check;

alter table public.applications
  add constraint applications_result_check
  check (result in ('beklemede', 'mulakat_bekleniyor', 'olumlu', 'staji_bitirdim', 'ret'));
