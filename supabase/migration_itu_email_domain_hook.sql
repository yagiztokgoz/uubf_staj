create or replace function public.enforce_itu_email_domain(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  email text;
begin
  email := lower(trim(coalesce(event->'user'->>'email', '')));

  if email = '' or split_part(email, '@', 2) <> 'itu.edu.tr' then
    return jsonb_build_object(
      'error',
      jsonb_build_object(
        'http_code', 400,
        'message', 'Sadece @itu.edu.tr uzantili e-posta adresleriyle giris yapabilirsiniz.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.enforce_itu_email_domain(jsonb) to supabase_auth_admin;
revoke execute on function public.enforce_itu_email_domain(jsonb) from anon, authenticated, public;
