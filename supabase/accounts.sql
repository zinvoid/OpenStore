-- OpenStore — contas de usuário (primeira versão)
-- Senhas ficam apenas como hash bcrypt (pgcrypto) e nunca são legíveis pelo cliente.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.openstore_users (
  id            uuid primary key default gen_random_uuid(),
  username      text not null,
  email         text,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create unique index if not exists openstore_users_username_key
  on public.openstore_users (lower(username));

create unique index if not exists openstore_users_email_key
  on public.openstore_users (lower(email))
  where email is not null;

-- Ninguém lê a tabela diretamente: só as funções abaixo (security definer).
alter table public.openstore_users enable row level security;
revoke all on table public.openstore_users from anon, authenticated;

alter table public.apps
  add column if not exists owner_id uuid references public.openstore_users (id) on delete set null;

create index if not exists apps_owner_idx on public.apps (owner_id);

-- ------------------------------------------------------------- cadastro
create or replace function public.openstore_signup(p_username text, p_email text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_username text := btrim(coalesce(p_username, ''));
  v_email    text := nullif(btrim(coalesce(p_email, '')), '');
  v_password text := coalesce(p_password, '');
  v_id       uuid;
begin
  if length(v_username) < 3 or length(v_username) > 20 then
    raise exception 'username_invalid';
  end if;
  if v_username !~ '^[A-Za-z0-9_.]+$' then
    raise exception 'username_chars';
  end if;
  if length(v_password) < 8 or v_password !~ '[A-Za-z]' or v_password !~ '[0-9]' then
    raise exception 'password_weak';
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'email_invalid';
  end if;
  if exists (select 1 from public.openstore_users u where lower(u.username) = lower(v_username)) then
    raise exception 'username_taken';
  end if;
  if v_email is not null
     and exists (select 1 from public.openstore_users u where lower(u.email) = lower(v_email)) then
    raise exception 'email_taken';
  end if;

  insert into public.openstore_users (username, email, password_hash)
  values (v_username, v_email, crypt(v_password, gen_salt('bf', 10)))
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'username', v_username, 'email', v_email);
end;
$$;

-- ---------------------------------------------------------------- login
create or replace function public.openstore_login(p_username text, p_password text)
returns jsonb
language sql
security definer
set search_path = public, extensions
as $$
  select jsonb_build_object('id', u.id, 'username', u.username, 'email', u.email)
    from public.openstore_users u
   where lower(u.username) = lower(btrim(coalesce(p_username, '')))
     and u.password_hash = crypt(coalesce(p_password, ''), u.password_hash)
   limit 1;
$$;

grant execute on function public.openstore_signup(text, text, text) to anon, authenticated;
grant execute on function public.openstore_login(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
