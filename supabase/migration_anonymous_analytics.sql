drop policy if exists "Herkes profilleri okuyabilir" on public.profiles;
drop policy if exists "Kullanıcı kendi profilini okuyabilir" on public.profiles;

create policy "Kullanıcı kendi profilini okuyabilir"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Herkes başvuruları okuyabilir" on public.applications;
drop policy if exists "Kullanıcı kendi başvurularını okuyabilir" on public.applications;

create policy "Kullanıcı kendi başvurularını okuyabilir"
  on public.applications
  for select
  using (auth.uid() = user_id);

create or replace view public.analytics_applications_anonymous as
select
  a.company_name,
  a.department as application_department,
  a.result,
  a.found_with_referral,
  a.salary,
  a.rating,
  p.gpa,
  p.interests,
  p.department as profile_department,
  p.class_year,
  p.minor_department,
  p.gender
from public.applications as a
join public.profiles as p
  on p.id = a.user_id;

grant select on public.analytics_applications_anonymous to anon, authenticated;
