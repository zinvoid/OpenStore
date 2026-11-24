-- OpenStore — schema base (Supabase / Postgres)
-- Primeira versão: qualquer pessoa pode publicar (sem verificação de autor).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- apps
create table if not exists public.apps (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  publisher      text not null,
  tagline        text,
  description    text,
  category       text not null default 'Utilitários',
  version        text default '1.0.0',
  price_cents    integer not null default 0,
  currency       text not null default 'BRL',
  website        text,
  support_url    text,
  logo_url       text,
  cover_url      text,
  accent         text default '#7c5cff',
  platforms      text[] not null default '{}',
  tags           text[] not null default '{}',
  screenshots    text[] not null default '{}',
  languages      text[] not null default '{}',
  age_rating     text default 'Livre',
  whats_new      text,
  rating         numeric(2,1) not null default 0,
  rating_count   integer not null default 0,
  downloads_count integer not null default 0,
  featured       boolean not null default false,
  verified       boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists apps_created_idx on public.apps (created_at desc);
create index if not exists apps_category_idx on public.apps (category);
create index if not exists apps_featured_idx on public.apps (featured);

-- ------------------------------------------------------------ downloads
create table if not exists public.app_downloads (
  id          uuid primary key default gen_random_uuid(),
  app_id      uuid not null references public.apps (id) on delete cascade,
  platform    text not null,            -- windows | linux | macos | android | web
  arch        text default 'universal', -- x64 | arm64 | x86 | universal
  format      text default '',          -- exe | msi | zip | deb | rpm | appimage | dmg | apk
  label       text,
  url         text not null,
  file_size   bigint default 0,
  version     text,
  min_os      text,
  created_at  timestamptz not null default now()
);

create index if not exists app_downloads_app_idx on public.app_downloads (app_id);

-- -------------------------------------------------------------- reviews
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  app_id     uuid not null references public.apps (id) on delete cascade,
  author     text not null default 'Anônimo',
  rating     integer not null check (rating between 1 and 5),
  body       text,
  created_at timestamptz not null default now()
);

create index if not exists reviews_app_idx on public.reviews (app_id);

-- -------------------------------------------------------------- counter
create or replace function public.increment_downloads(app_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.apps
     set downloads_count = downloads_count + 1
   where slug = app_slug;
$$;

grant execute on function public.increment_downloads(text) to anon, authenticated;

-- ------------------------------------------------------------------ RLS
alter table public.apps enable row level security;
alter table public.app_downloads enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "apps read" on public.apps;
create policy "apps read" on public.apps for select using (true);

drop policy if exists "apps insert" on public.apps;
create policy "apps insert" on public.apps for insert with check (true);

drop policy if exists "apps update" on public.apps;
create policy "apps update" on public.apps for update using (true) with check (true);

drop policy if exists "downloads read" on public.app_downloads;
create policy "downloads read" on public.app_downloads for select using (true);

drop policy if exists "downloads insert" on public.app_downloads;
create policy "downloads insert" on public.app_downloads for insert with check (true);

drop policy if exists "reviews read" on public.reviews;
create policy "reviews read" on public.reviews for select using (true);

drop policy if exists "reviews insert" on public.reviews;
create policy "reviews insert" on public.reviews for insert with check (true);

-- -------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit)
values ('app-assets', 'app-assets', true, 5242880),
       ('app-files',  'app-files',  true, null)
on conflict (id) do nothing;

drop policy if exists "openstore assets read" on storage.objects;
create policy "openstore assets read" on storage.objects
  for select using (bucket_id in ('app-assets', 'app-files'));

drop policy if exists "openstore assets insert" on storage.objects;
create policy "openstore assets insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id in ('app-assets', 'app-files'));
