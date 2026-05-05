-- applications tablosuna period kolonu ekle
alter table public.applications
  add column if not exists period text;

-- applied_at artık kullanılmıyor; nullable yap ve default'u kaldır
alter table public.applications
  alter column applied_at drop default;

alter table public.applications
  alter column applied_at drop not null;

-- Platform istatistiklerini döndüren güvenli fonksiyon
-- (RLS'i bypass ederek toplam kullanıcı sayısını okur)
create or replace function public.get_platform_stats()
returns json
language sql
security definer
set search_path = ''
as $$
  select json_build_object(
    'total_users', (select count(*)::integer from public.profiles)
  );
$$;

revoke all on function public.get_platform_stats() from public;
grant execute on function public.get_platform_stats() to authenticated;
