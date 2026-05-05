alter table public.applications
  add column if not exists rating_work_conditions integer
  check (rating_work_conditions between 1 and 5);

create or replace view public.analytics_applications_anonymous as
select
  a.company_name,
  a.department as application_department,
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
  p.department as profile_department,
  p.class_year,
  p.minor_department,
  p.gender,
  a.period,
  a.rating_work_conditions
from public.applications as a
join public.profiles as p
  on p.id = a.user_id;

revoke all on public.analytics_applications_anonymous from anon, authenticated;
grant select on public.analytics_applications_anonymous to authenticated;
