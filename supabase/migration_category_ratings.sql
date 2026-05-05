alter table public.applications
  add column if not exists rating_environment integer check (rating_environment between 1 and 5),
  add column if not exists rating_facilities  integer check (rating_facilities  between 1 and 5),
  add column if not exists rating_colleagues  integer check (rating_colleagues  between 1 and 5),
  add column if not exists rating_technical   integer check (rating_technical   between 1 and 5);

-- view'a yeni kolonları ekle
drop view if exists public.analytics_applications_anonymous;

create view public.analytics_applications_anonymous as
select
  a.company_name,
  a.department        as application_department,
  a.result,
  a.rejection_stage,
  a.found_with_referral,
  a.salary,
  a.rating,
  a.rating_environment,
  a.rating_facilities,
  a.rating_colleagues,
  a.rating_technical,
  p.gpa,
  p.interests,
  p.department        as profile_department,
  p.class_year,
  p.minor_department,
  p.gender,
  a.period
from public.applications as a
join public.profiles as p on p.id = a.user_id;

revoke all on public.analytics_applications_anonymous from anon, authenticated;
grant select on public.analytics_applications_anonymous to authenticated;
