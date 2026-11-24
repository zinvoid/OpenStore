// Executa SQL no projeto Supabase via Management API.
// uso: SUPABASE_ACCESS_TOKEN=... node scripts/run-sql.mjs supabase/schema.sql
import fs from 'node:fs'

const REF = 'pbsqbsxargtmqhndogvm'
const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('SUPABASE_ACCESS_TOKEN ausente')
  process.exit(1)
}

const file = process.argv[2]
const query = file ? fs.readFileSync(file, 'utf8') : process.env.SQL
if (!query) {
  console.error('informe o arquivo sql')
  process.exit(1)
}

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
})

const text = await res.text()
console.log(res.status, text.slice(0, 2000))
process.exit(res.ok ? 0 : 1)
