-- analytics_comments_authenticated view'ına period kolonu ekle
-- Not: CREATE OR REPLACE VIEW yeni kolonu sona eklemek zorunda
create or replace view public.analytics_comments_authenticated as
select
  a.id,
  a.company_name,
  a.department as application_department,
  a.result,
  a.salary,
  a.rating,
  a.interview_note,
  a.experience_note,
  a.period
from public.applications as a
where a.interview_note is not null
   or a.experience_note is not null;

revoke all on public.analytics_comments_authenticated from anon, authenticated;
grant select on public.analytics_comments_authenticated to authenticated;
