-- OpenStore — preparação para uso público
-- 1) verificação de arquivos (SHA-256 + resultado de análise)
-- 2) sessões por token: o cliente nunca escreve direto nas tabelas
-- 3) função única de publicação/edição que confere o dono do app

-- ------------------------------------------------------- verificação de arquivo

alter table public.app_downloads add column if not exists sha256 text;
alter table public.app_downloads add column if not exists scan_status text not null default 'pendente';
alter table public.app_downloads add column if not exists scan_engine text;
alter table public.app_downloads add column if not exists scan_at timestamptz;

-- ------------------------------------------------------------------ sessões

create table if not exists public.openstore_sessions (
  token      uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.openstore_users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '365 days'
);

create index if not exists openstore_sessions_user_idx on public.openstore_sessions (user_id);

alter table public.openstore_sessions enable row level security;
revoke all on table public.openstore_sessions from anon, authenticated;

-- ------------------------------------------------------- cadastro com token

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
  v_token    uuid;
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

  insert into public.openstore_sessions (user_id) values (v_id) returning token into v_token;

  return jsonb_build_object('id', v_id, 'username', v_username, 'email', v_email, 'token', v_token);
end;
$$;

-- ---------------------------------------------------------- login com token

create or replace function public.openstore_login(p_username text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user  public.openstore_users%rowtype;
  v_token uuid;
begin
  select * into v_user
    from public.openstore_users u
   where lower(u.username) = lower(btrim(coalesce(p_username, '')))
     and u.password_hash = crypt(coalesce(p_password, ''), u.password_hash)
   limit 1;

  if v_user.id is null then
    return null;
  end if;

  insert into public.openstore_sessions (user_id) values (v_user.id) returning token into v_token;

  return jsonb_build_object('id', v_user.id, 'username', v_user.username, 'email', v_user.email, 'token', v_token);
end;
$$;

grant execute on function public.openstore_signup(text, text, text) to anon, authenticated;
grant execute on function public.openstore_login(text, text) to anon, authenticated;

-- --------------------------------------------- publicação/edição autenticada

create or replace function public.openstore_save_app(p_token uuid, p_slug text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user  uuid;
  v_app   public.apps%rowtype;
  v_slug  text;
  v_base  text;
  v_try   integer := 1;
  v_dl    jsonb;
begin
  select s.user_id into v_user
    from public.openstore_sessions s
   where s.token = p_token
     and s.expires_at > now();
  if v_user is null then
    raise exception 'session_invalid';
  end if;

  update public.openstore_sessions set last_seen = now() where token = p_token;

  if p_slug is null then
    v_base := nullif(btrim(coalesce(p_payload->>'slug_base', '')), '');
    if v_base is null then
      v_base := 'app-' || to_char(now(), 'YYYYMMDDHH24MISS');
    end if;
    v_base := regexp_replace(lower(v_base), '[^a-z0-9]+', '-', 'g');
    v_base := btrim(v_base, '-');
    v_slug := v_base;
    while exists (select 1 from public.apps a where a.slug = v_slug) loop
      v_try := v_try + 1;
      v_slug := v_base || '-' || v_try;
    end loop;

    insert into public.apps (
      slug, name, publisher, owner_id, tagline, description, category, version,
      price_cents, website, support_url, logo_url, cover_url, accent,
      tags, screenshots, languages, age_rating, whats_new
    ) values (
      v_slug,
      btrim(coalesce(p_payload->>'name', 'App')),
      coalesce(nullif(btrim(coalesce(p_payload->>'publisher', '')), ''), 'Anônimo'),
      v_user,
      nullif(btrim(coalesce(p_payload->>'tagline', '')), ''),
      nullif(btrim(coalesce(p_payload->>'description', '')), ''),
      coalesce(nullif(btrim(coalesce(p_payload->>'category', '')), ''), 'Outros'),
      coalesce(nullif(btrim(coalesce(p_payload->>'version', '')), ''), '1.0.0'),
      coalesce((p_payload->>'price_cents')::integer, 0),
      nullif(btrim(coalesce(p_payload->>'website', '')), ''),
      nullif(btrim(coalesce(p_payload->>'support_url', '')), ''),
      nullif(p_payload->>'logo_url', ''),
      nullif(p_payload->>'cover_url', ''),
      coalesce(nullif(p_payload->>'accent', ''), '#7c5cff'),
      coalesce(array(select jsonb_array_elements_text(coalesce(p_payload->'tags', '[]'::jsonb))), '{}'),
      coalesce(array(select jsonb_array_elements_text(coalesce(p_payload->'screenshots', '[]'::jsonb))), '{}'),
      coalesce(array(select jsonb_array_elements_text(coalesce(p_payload->'languages', '[]'::jsonb))), '{}'),
      coalesce(nullif(btrim(coalesce(p_payload->>'age_rating', '')), ''), 'Livre'),
      nullif(btrim(coalesce(p_payload->>'whats_new', '')), '')
    )
    returning * into v_app;
  else
    select * into v_app from public.apps a where a.slug = p_slug;
    if v_app.id is null then
      raise exception 'app_missing';
    end if;
    if v_app.owner_id is distinct from v_user then
      raise exception 'not_owner';
    end if;

    update public.apps set
      name        = btrim(coalesce(p_payload->>'name', name)),
      publisher   = coalesce(nullif(btrim(coalesce(p_payload->>'publisher', '')), ''), publisher),
      tagline     = nullif(btrim(coalesce(p_payload->>'tagline', '')), ''),
      description = nullif(btrim(coalesce(p_payload->>'description', '')), ''),
      category    = coalesce(nullif(btrim(coalesce(p_payload->>'category', '')), ''), category),
      version     = coalesce(nullif(btrim(coalesce(p_payload->>'version', '')), ''), version),
      price_cents = coalesce((p_payload->>'price_cents')::integer, price_cents),
      website     = nullif(btrim(coalesce(p_payload->>'website', '')), ''),
      support_url = nullif(btrim(coalesce(p_payload->>'support_url', '')), ''),
      logo_url    = nullif(p_payload->>'logo_url', ''),
      cover_url   = nullif(p_payload->>'cover_url', ''),
      accent      = coalesce(nullif(p_payload->>'accent', ''), accent),
      tags        = coalesce(array(select jsonb_array_elements_text(coalesce(p_payload->'tags', '[]'::jsonb))), '{}'),
      screenshots = coalesce(array(select jsonb_array_elements_text(coalesce(p_payload->'screenshots', '[]'::jsonb))), '{}'),
      languages   = coalesce(array(select jsonb_array_elements_text(coalesce(p_payload->'languages', '[]'::jsonb))), '{}'),
      age_rating  = coalesce(nullif(btrim(coalesce(p_payload->>'age_rating', '')), ''), age_rating),
      whats_new   = nullif(btrim(coalesce(p_payload->>'whats_new', '')), '')
    where id = v_app.id
    returning * into v_app;
  end if;

  delete from public.app_downloads where app_id = v_app.id;

  for v_dl in select * from jsonb_array_elements(coalesce(p_payload->'downloads', '[]'::jsonb)) loop
    if coalesce(btrim(v_dl->>'url'), '') = '' then
      continue;
    end if;

    insert into public.app_downloads (
      app_id, platform, arch, format, label, url, file_size, version, min_os,
      sha256, scan_status, scan_engine, scan_at
    ) values (
      v_app.id,
      coalesce(nullif(btrim(v_dl->>'platform'), ''), 'windows'),
      coalesce(nullif(btrim(v_dl->>'arch'), ''), 'universal'),
      coalesce(nullif(btrim(v_dl->>'format'), ''), ''),
      nullif(btrim(coalesce(v_dl->>'label', '')), ''),
      btrim(v_dl->>'url'),
      coalesce((v_dl->>'file_size')::bigint, 0),
      coalesce(nullif(btrim(v_dl->>'version'), ''), v_app.version),
      nullif(btrim(coalesce(v_dl->>'min_os', '')), ''),
      nullif(v_dl->>'sha256', ''),
      coalesce(nullif(btrim(v_dl->>'scan_status'), ''), 'pendente'),
      nullif(v_dl->>'scan_engine', ''),
      case when coalesce(v_dl->>'scan_at', '') <> '' then (v_dl->>'scan_at')::timestamptz else null end
    );
  end loop;

  update public.apps
     set platforms = coalesce(
       (select array_agg(distinct d.platform) from public.app_downloads d where d.app_id = v_app.id),
       '{}'
     )
   where id = v_app.id;

  return jsonb_build_object('slug', v_app.slug);
end;
$$;

grant execute on function public.openstore_save_app(uuid, text, jsonb) to anon, authenticated;

-- ------------------------------------------- fecha a escrita direta nas tabelas

drop policy if exists "apps insert" on public.apps;
drop policy if exists "apps update" on public.apps;
drop policy if exists "downloads insert" on public.app_downloads;
drop policy if exists "downloads update" on public.app_downloads;
drop policy if exists "downloads delete" on public.app_downloads;

notify pgrst, 'reload schema';
