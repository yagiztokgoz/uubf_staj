-- Profiller tablosu
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  department text,
  gpa numeric(3,2),
  interests text[], -- akademik ilgi alanları
  thesis_topic text,
  thesis_description text,
  class_year text,
  minor_department text,
  thesis_advisor text,
  gender text check (gender in ('erkek', 'kadın', 'belirtmek istemiyorum')),
  projects text, -- serbest metin
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Staj başvuruları tablosu
create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  company_name text not null,
  department text,
  result text check (result in ('beklemede', 'mulakat_bekleniyor', 'olumlu', 'staji_bitirdim', 'ret')) default 'beklemede',
  found_with_referral boolean default false,
  interview_note text,
  experience_note text,
  applied_at date default current_date,
  salary integer,
  rating integer check (rating between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS etkinleştir
alter table public.profiles enable row level security;
alter table public.applications enable row level security;

-- Profiles politikaları
create policy "Kullanıcı kendi profilini okuyabilir"
  on public.profiles for select using (auth.uid() = id);

create policy "Kullanıcı kendi profilini oluşturabilir"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Kullanıcı kendi profilini güncelleyebilir"
  on public.profiles for update using (auth.uid() = id);

-- Applications politikaları
create policy "Kullanıcı kendi başvurularını okuyabilir"
  on public.applications for select using (auth.uid() = user_id);

create policy "Kullanıcı kendi başvurularını ekleyebilir"
  on public.applications for insert with check (auth.uid() = user_id);

create policy "Kullanıcı kendi başvurularını güncelleyebilir"
  on public.applications for update using (auth.uid() = user_id);

create policy "Kullanıcı kendi başvurularını silebilir"
  on public.applications for delete using (auth.uid() = user_id);

-- Herkese açık anonim analitik görünümü
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

create or replace view public.analytics_comments_authenticated as
select
  a.id,
  a.company_name,
  a.department as application_department,
  a.result,
  a.salary,
  a.rating,
  a.interview_note,
  a.experience_note
from public.applications as a
where a.interview_note is not null
   or a.experience_note is not null;

grant select on public.analytics_comments_authenticated to authenticated;

-- Yeni kullanıcı kaydolunca otomatik profil oluştur
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
