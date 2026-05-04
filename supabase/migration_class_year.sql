alter table public.profiles add column if not exists class_year text;
alter table public.profiles add column if not exists minor_department text;
alter table public.profiles add column if not exists thesis_advisor text;
alter table public.profiles add column if not exists gender text check (gender in ('erkek', 'kadın', 'belirtmek istemiyorum'));

alter table public.applications add column if not exists salary integer;
alter table public.applications add column if not exists rating integer check (rating between 1 and 5);
