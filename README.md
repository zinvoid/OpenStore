# OpenStore

Loja aberta de aplicativos: qualquer pessoa publica o seu programa, qualquer pessoa instala — com o download certo
para o sistema dela.

O projeto tem duas partes no mesmo repositório:

- **Site (SPA)** em React + Vite + Tailwind, com uma landing page pública e a loja em `#/home`.
- **App desktop** em Electron, que gerencia os apps instalados (abrir, ver o local, mover, buscar o executável, trocar
  de versão, desinstalar) e analisa cada instalador com o ClamAV antes de abrir.

Backend: Supabase (Postgres, Storage e funções SQL).

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev            # site em http://127.0.0.1:5173
npm run electron:dev   # site + app desktop
```

Checagens:

```bash
npm run typecheck
npm run build
```

## Ícones

A marca vive em dois lugares: `build/icon.png` (fonte quadrada com transparência) e `build/icon.ico` (multi-tamanho,
usado pelo `.exe`, pelo instalador e pelos atalhos). Para regenerar o `.ico` depois de trocar o PNG:

```bash
node scripts/make-ico.cjs
```

O site usa `public/icon.png` e a marca vetorial em `src/components/GhostLogo.tsx`.

## Banco de dados

Os arquivos em `supabase/` são aplicados em ordem no projeto:

| Arquivo | Conteúdo |
| --- | --- |
| `schema.sql` | tabelas de apps, downloads, avaliações e buckets de Storage |
| `accounts.sql` | contas com senha em hash bcrypt |
| `edits.sql` | políticas antigas de edição (substituídas por `publico.sql`) |
| `releases.sql` | canal de versões da própria OpenStore |
| `publico.sql` | sessões por token, função `openstore_save_app` e colunas de verificação |

Para aplicar via Management API:

```bash
SUPABASE_ACCESS_TOKEN=... node scripts/run-sql.mjs supabase/publico.sql
```

### Modelo de escrita

O cliente **não escreve** nas tabelas. Cadastro e login emitem um token de sessão e toda publicação/edição passa por
`openstore_save_app(token, slug, payload)`, que confere a sessão e o dono do app antes de gravar. As políticas RLS
continuam permitindo apenas leitura pública.

### Verificação dos arquivos

- No envio: formato permitido, tamanho máximo e **SHA-256** calculados no navegador e gravados em `app_downloads`.
- Na instalação (desktop): o arquivo baixado é analisado pelo **ClamAV** da máquina antes de qualquer execução. Se o
  ClamAV não estiver instalado, a loja avisa em vez de fingir que analisou.
- O status (`pendente`, `aprovado`, `suspeito`, `bloqueado`) aparece na página do app.

## Versões

`package.json` é a fonte da versão. O app desktop compara a versão em execução com a tabela `openstore_releases` e
mostra o aviso de atualização; no desktop, o instalador é baixado e aberto pelo próprio app.

Fluxo de uma versão nova:

1. `npm version patch|minor|major` (ou edite `package.json`).
2. `npm run dist:win` para gerar instalador e portátil em `release/`.
3. Publique o `.exe` (GitHub Releases) e registre a versão:

```bash
SUPABASE_ACCESS_TOKEN=... node scripts/publish-release.mjs 1.3.0 "Notas da versão" \
  "https://github.com/USUARIO/OpenStore/releases/download/v1.3.0/OpenStore%20Setup%201.3.0.exe"
```

O site e o app passam a mostrar a atualização automaticamente.

## Roadmap

- [x] Windows (NSIS + portátil)
- [ ] Linux: `.deb`, `.flatpak`, pacote Arch e `.AppImage`
- [ ] macOS (`.dmg`)

## Licença

MIT — veja [LICENSE](LICENSE).
