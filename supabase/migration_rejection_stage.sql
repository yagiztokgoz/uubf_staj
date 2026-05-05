alter table public.applications
  add column if not exists rejection_stage text
  check (rejection_stage in ('Genel Yetenek', 'İK Mülakatı', 'Teknik Mülakat'));
