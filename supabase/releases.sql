-- OpenStore — catálogo vazio + canal de atualizações da própria OpenStore
-- Rode este arquivo sempre que quiser limpar apps que ninguém publicou.

-- 1) remove todo app sem dono (catálogo de exemplo). Só fica o que usuários publicarem.
delete from public.apps where owner_id is null;

-- 2) versões publicadas da OpenStore (usada pelo popup de atualização)
create table if not exists public.openstore_releases (
  version      text primary key,
  notes        text,
  url          text,
  published_at timestamptz not null default now()
);

alter table public.openstore_releases enable row level security;

drop policy if exists "releases read" on public.openstore_releases;
create policy "releases read" on public.openstore_releases for select using (true);

insert into public.openstore_releases (version, notes)
values ('1.0.0', 'Primeira versão pública da OpenStore: catálogo, contas, publicação de apps e gerenciador de apps instalados.')
on conflict (version) do nothing;
