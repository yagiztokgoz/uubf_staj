-- analytics_applications_anonymous view'ına period kolonu ekle
create or replace view public.analytics_applications_anonymous as
select
  a.company_name,
  a.department as application_department,
  a.result,
  a.found_with_referral,
  a.salary,
  a.rating,
  a.period,
  p.gpa,
  p.interests,
  p.department as profile_department,
  p.class_year,
  p.minor_department,
  p.gender
from public.applications as a
join public.profiles as p
  on p.id = a.user_id;

revoke all on public.analytics_applications_anonymous from anon, authenticated;
grant select on public.analytics_applications_anonymous to authenticated;
