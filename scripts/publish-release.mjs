// Registra uma versão da OpenStore no canal de atualizações (tabela openstore_releases).
// O site e o app leem essa tabela para avisar quando há versão nova.
//
// uso:
//   SUPABASE_ACCESS_TOKEN=... node scripts/publish-release.mjs <versao> "<notas>" ["<url do instalador>"]
//
// exemplo:
//   node scripts/publish-release.mjs 1.3.0 "Nova logo, landing page e verificação ClamAV" \
//     "https://github.com/usuario/OpenStore/releases/download/v1.3.0/OpenStore%20Setup%201.3.0.exe"

import fs from 'node:fs'

const REF = 'pbsqbsxargtmqhndogvm'
const token = process.env.SUPABASE_ACCESS_TOKEN
const [version, notes = '', url = ''] = process.argv.slice(2)

if (!token) {
  console.error('SUPABASE_ACCESS_TOKEN ausente')
  process.exit(1)
}
if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error('informe a versão (ex.: 1.3.0)')
  process.exit(1)
}
if (url && !/^https?:\/\//i.test(url)) {
  console.error('a URL do instalador precisa começar com http:// ou https://')
  process.exit(1)
}

const query = `
  insert into public.openstore_releases (version, notes, url, published_at)
  values ($version$${version}$version$, $notes$${notes}$notes$, ${url ? `$url$${url}$url$` : 'null'}, now())
  on conflict (version) do update
    set notes = excluded.notes,
        url = coalesce(excluded.url, public.openstore_releases.url),
        published_at = now()
  returning version, url;
`

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
})

const text = await res.text()
console.log(res.status, text.slice(0, 800))
process.exit(res.ok ? 0 : 1)
