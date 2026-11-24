import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApp, publishApp, updateApp, uploadAsset, uploadBinary, type DownloadInput } from '../lib/api'
import { CATEGORIES } from '../lib/types'
import { PLATFORMS, archLabel, extensionOf, formatLabel, platformFromExtension } from '../lib/platform'
import { assetUrl, formatBytes, slugify } from '../lib/format'
import { GhostMark } from '../components/GhostLogo'
import { useAccount } from '../lib/auth'
import { OsIcon } from '../components/OsIcon'
import { CheckIcon, ImageIcon, PlusIcon, ShieldIcon, TrashIcon, UploadIcon } from '../components/Icons'
import { fileExtension, scanMeta, sha256Hex, shortHash, validateBinary } from '../lib/security'

const ACCENTS = ['#7c5cff', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f97316']
const AGE_RATINGS = ['Livre', '10+', '12+', '14+', '16+', '18+']
const ARCHES = ['x64', 'x86', 'arm64', 'universal']
const PLATFORM_KEYS = ['windows', 'macos', 'linux', 'android', 'ios']

interface Row extends DownloadInput {
  key: string
  fileName?: string
  uploading?: boolean
  sha256?: string | null
  scanStatus?: string | null
  scanEngine?: string | null
  scanAt?: string | null
}

function emptyRow(platform = 'windows'): Row {
  return {
    key: crypto.randomUUID(),
    platform,
    arch: 'x64',
    format: PLATFORMS[platform]?.extensions[0] ?? 'exe',
    label: '',
    url: '',
    fileSize: 0,
    minOs: '',
  }
}

export default function Publish() {
  const navigate = useNavigate()
  const account = useAccount()
  const { slug: editSlug } = useParams()
  const editing = Boolean(editSlug)
  const [loadedSlug, setLoadedSlug] = useState('')
  const [loadingApp, setLoadingApp] = useState(Boolean(editSlug))
  const [loadError, setLoadError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [publisher, setPublisher] = useState(() => account?.username ?? '')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0].key)
  const [version, setVersion] = useState('1.0.0')
  const [price, setPrice] = useState('0')
  const [website, setWebsite] = useState('')
  const [supportUrl, setSupportUrl] = useState('')
  const [accent, setAccent] = useState(ACCENTS[0])
  const [ageRating, setAgeRating] = useState('Livre')
  const [whatsNew, setWhatsNew] = useState('')
  const [tags, setTags] = useState('')
  const [languages, setLanguages] = useState('Português (Brasil), Inglês')

  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [rows, setRows] = useState<Row[]>(() => [emptyRow()])

  const [busy, setBusy] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const slug = useMemo(
    () => (editing ? loadedSlug || editSlug || 'app' : slugify(name) || 'novo-app'),
    [editing, loadedSlug, editSlug, name],
  )
  const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)
  const langList = languages.split(',').map((l) => l.trim()).filter(Boolean)
  const priceCents = Math.max(0, Math.round((Number(price) || 0) * 100))
  const platforms = useMemo(() => Array.from(new Set(rows.map((r) => r.platform))), [rows])

  useEffect(() => {
    if (!editSlug || !account) return
    let alive = true
    getApp(editSlug)
      .then((app) => {
        if (!alive) return
        if (!app) throw new Error('Este app não existe mais.')
        if (app.owner_id !== account.id) throw new Error('Só quem publicou este app pode editá-lo.')
        setLoadedSlug(app.slug)
        setName(app.name)
        setPublisher(app.publisher)
        setTagline(app.tagline ?? '')
        setDescription(app.description ?? '')
        setCategory(app.category)
        setVersion(app.version ?? '1.0.0')
        setPrice(String((app.price_cents ?? 0) / 100))
        setWebsite(app.website ?? '')
        setSupportUrl(app.support_url ?? '')
        setAccent(app.accent ?? ACCENTS[0])
        setAgeRating(app.age_rating ?? 'Livre')
        setWhatsNew(app.whats_new ?? '')
        setTags((app.tags ?? []).join(', '))
        setLanguages((app.languages ?? []).join(', '))
        setLogoUrl(app.logo_url ?? '')
        setCoverUrl(app.cover_url ?? '')
        setScreenshots(app.screenshots ?? [])
        const downloads = (app.app_downloads ?? []).map((d) => ({
          id: d.id,
          key: crypto.randomUUID(),
          platform: d.platform,
          arch: d.arch ?? 'universal',
          format: d.format ?? '',
          label: d.label ?? '',
          url: d.url,
          fileSize: d.file_size ?? 0,
          minOs: d.min_os ?? '',
          sha256: d.sha256 ?? null,
          scanStatus: d.scan_status ?? null,
          scanEngine: d.scan_engine ?? null,
          scanAt: d.scan_at ?? null,
        }))
        setRows(downloads.length ? downloads : [emptyRow()])
      })
      .catch((error) => alive && setLoadError((error as Error).message || 'Não foi possível carregar este app.'))
      .finally(() => alive && setLoadingApp(false))
    return () => {
      alive = false
    }
  }, [editSlug, account])

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function guessPlatform(key: string, value: string) {
    const ext = extensionOf(value)
    if (!ext) return
    const platform = platformFromExtension(ext)
    if (!platform) return
    const meta = PLATFORMS[platform]
    updateRow(key, { platform, format: ext, arch: platform === 'android' || platform === 'ios' ? 'universal' : 'x64', ...(meta ? {} : {}) })
  }

  async function handleAsset(file: File, kind: 'logo' | 'cover' | 'screenshot') {
    setErrors([])
    setBusy(`${kind}:${file.name}`)
    try {
      const url = await uploadAsset(file, slug, kind)
      if (kind === 'logo') setLogoUrl(url)
      else if (kind === 'cover') setCoverUrl(url)
      else setScreenshots((prev) => [...prev, url].slice(0, 8))
    } catch (err) {
      setErrors([(err as Error).message])
    } finally {
      setBusy(null)
    }
  }

  async function handleBinary(row: Row, file: File) {
    setErrors([])
    const problems = validateBinary(file)
    if (problems.length) {
      setErrors(problems)
      return
    }
    updateRow(row.key, { uploading: true, fileName: file.name, fileSize: file.size })
    try {
      const sha256 = await sha256Hex(file)
      const url = await uploadBinary(file, slug)
      guessPlatform(row.key, file.name)
      updateRow(row.key, {
        url,
        uploading: false,
        fileSize: file.size,
        fileName: file.name,
        format: fileExtension(file.name) || row.format,
        sha256,
        scanStatus: 'pendente',
        scanEngine: 'SHA-256',
        scanAt: new Date().toISOString(),
      })
    } catch (err) {
      updateRow(row.key, { uploading: false })
      setErrors([(err as Error).message])
    }
  }

  function validate(): string[] {
    const list: string[] = []
    if (!name.trim()) list.push('Informe o nome do app.')
    if (!publisher.trim()) list.push('Informe o nome do publicador.')
    if (!tagline.trim()) list.push('Escreva uma descrição curta (tagline).')
    if (!description.trim()) list.push('Descreva o app no campo de descrição.')
    if (!rows.some((r) => r.url.trim())) list.push('Adicione pelo menos um download (URL ou arquivo).')
    if (rows.some((r) => r.url.trim() && !/^https?:\/\//i.test(r.url.trim()))) {
      list.push('As URLs de download devem começar com http:// ou https://.')
    }
    if (screenshots.length === 0 && !coverUrl) list.push('Envie uma capa ou ao menos uma captura de tela.')
    return list
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const problems = validate()
    setErrors(problems)
    if (problems.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        name,
        publisher,
        tagline,
        description,
        category,
        version,
        priceCents,
        website,
        supportUrl,
        accent,
        logoUrl,
        coverUrl,
        screenshots,
        tags: tagList,
        languages: langList,
        ageRating,
        whatsNew,
        downloads: rows
          .filter((r) => r.url.trim())
          .map(({ key: _key, fileName: _fileName, uploading: _uploading, ...d }) => d),
      }
      const resultSlug =
        editing && loadedSlug ? await updateApp(loadedSlug, payload) : await publishApp(payload)
      navigate(`/app/${resultSlug}`)
    } catch (err) {
      setErrors([(err as Error).message])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!account) return <AccountGate />
  if (editing && loadingApp) return <EditSkeleton />
  if (editing && loadError) return <EditBlocked message={loadError} />

  const coverPreview = assetUrl(coverUrl)
  const logoPreview = assetUrl(logoUrl)

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-[1220px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-ink">
            {editing ? 'Editar' : 'Publicar'}
          </p>
          <h1 className="mt-1 font-display text-[26px] font-semibold tracking-[-0.02em]">
            {editing ? `Editar ${name || 'seu app'}` : 'Coloque seu app na loja'}
          </h1>
          <p className="mt-1 max-w-[640px] text-[12.5px] leading-relaxed text-muted">
            {editing
              ? 'Atualize textos, arte, versão e downloads. As mudanças aparecem na loja assim que você salvar.'
              : 'Qualquer pessoa pode publicar. Envie o programa em .exe, .msi, .deb, .AppImage, .apk e outros formatos — o OpenStore detecta o sistema do visitante e oferece o download certo.'}
          </p>
        </div>
        <div className="max-w-[290px] rounded-md border border-line bg-surface-2 px-3 py-2 text-[11px] leading-relaxed text-muted">
          <ShieldIcon className="mr-1 inline size-3.5 align-[-2px] text-accent-ink" />
          Cada arquivo passa por formato, tamanho e SHA-256. A análise antivírus (ClamAV) roda no app do desktop
          antes de instalar.
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-4 rounded-[var(--radius-card)] border border-red-500/40 bg-red-500/10 px-3.5 py-3">
                      <p className="text-[12px] font-semibold text-red-500">Revise antes de salvar:</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11.5px] text-red-500/90">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-5">
          <Section title="Detalhes do app" subtitle="Como ele aparece na loja.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome do app *">
                <input value={name} onChange={(e) => setName(e.target.value)} className="field" maxLength={70} required />
              </Field>
              <Field label="Publicador *">
                <input
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  className="field"
                  placeholder="Seu nome ou estúdio"
                  maxLength={60}
                  required
                />
              </Field>
            </div>
            <Field label="Descrição curta *" hint={`${tagline.length}/120`}>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="field"
                placeholder="Uma frase que resume o app"
                maxLength={120}
                required
              />
            </Field>
            <Field label="Descrição completa *" hint="Separe parágrafos com uma linha em branco.">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="field min-h-[130px] resize-y"
                maxLength={4000}
                required
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Categoria">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="field">
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.key}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Versão">
                <input value={version} onChange={(e) => setVersion(e.target.value)} className="field" maxLength={24} />
              </Field>
              <Field label="Preço (R$)" hint="0 = grátis">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="field"
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Site oficial">
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="field"
                  placeholder="https://"
                  inputMode="url"
                />
              </Field>
              <Field label="Suporte">
                <input
                  value={supportUrl}
                  onChange={(e) => setSupportUrl(e.target.value)}
                  className="field"
                  placeholder="https://"
                  inputMode="url"
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tags" hint="separadas por vírgula">
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="field"
                  placeholder="hex, disassembler, debug"
                />
              </Field>
              <Field label="Idiomas" hint="separados por vírgula">
                <input value={languages} onChange={(e) => setLanguages(e.target.value)} className="field" />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Classificação indicativa">
                <select value={ageRating} onChange={(e) => setAgeRating(e.target.value)} className="field">
                  {AGE_RATINGS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cor de destaque">
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {ACCENTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Cor ${c}`}
                      onClick={() => setAccent(c)}
                      className={`size-6 rounded-full ring-2 transition ${
                        accent === c ? 'ring-ink' : 'ring-transparent hover:ring-line-strong'
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Novidades desta versão">
              <textarea
                value={whatsNew}
                onChange={(e) => setWhatsNew(e.target.value)}
                className="field min-h-[76px] resize-y"
                maxLength={800}
                placeholder="O que mudou nesta versão?"
              />
            </Field>
          </Section>

          <Section title="Arte do app" subtitle="Logo quadrado, capa widescreen e capturas de tela.">
            <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
              <div>
                <p className="mb-1.5 text-[11.5px] font-medium text-ink-soft">Logo</p>
                <label className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-[18px] border border-dashed border-line-strong bg-surface-2 transition hover:border-accent">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo enviado" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-muted">
                      <ImageIcon className="size-5" />
                      <span className="text-[10.5px]">Enviar logo</span>
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => pickImage(e, (f) => handleAsset(f, 'logo'))}
                  />
                  {busy?.startsWith('logo:') && <span className="absolute inset-0 grid place-items-center bg-black/50 text-[10px] text-white">Enviando…</span>}
                </label>
                {logoUrl && (
                  <button type="button" onClick={() => setLogoUrl('')} className="mt-1.5 text-[10.5px] text-muted hover:text-red-500">
                    Remover logo
                  </button>
                )}
              </div>

              <div className="min-w-0">
                <p className="mb-1.5 text-[11.5px] font-medium text-ink-soft">Capa</p>
                <label className="group relative flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-line-strong bg-surface-2 transition hover:border-accent">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Capa enviada" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-muted">
                      <ImageIcon className="size-5" />
                      <span className="text-[10.5px]">Enviar capa 16:9</span>
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => pickImage(e, (f) => handleAsset(f, 'cover'))}
                  />
                  {busy?.startsWith('cover:') && <span className="absolute inset-0 grid place-items-center bg-black/50 text-[10px] text-white">Enviando…</span>}
                </label>
                {coverUrl && (
                  <button type="button" onClick={() => setCoverUrl('')} className="mt-1.5 text-[10.5px] text-muted hover:text-red-500">
                    Remover capa
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11.5px] font-medium text-ink-soft">Capturas de tela</p>
              <div className="flex flex-wrap gap-2">
                {screenshots.map((s, i) => (
                  <div key={s} className="group relative w-[150px] overflow-hidden rounded-md border border-line">
                    <img src={assetUrl(s)} alt={`Captura ${i + 1}`} className="aspect-video w-full object-cover" />
                    <button
                      type="button"
                      aria-label="Remover captura"
                      onClick={() => setScreenshots((prev) => prev.filter((x) => x !== s))}
                      className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <TrashIcon className="size-3" />
                    </button>
                  </div>
                ))}
                {screenshots.length < 8 && (
                  <label className="flex h-[86px] w-[150px] cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line-strong bg-surface-2 text-muted transition hover:border-accent hover:text-accent-ink">
                    {busy?.startsWith('screenshot:') ? (
                      <span className="text-[10.5px]">Enviando…</span>
                    ) : (
                      <>
                        <PlusIcon className="size-4" />
                        <span className="text-[10.5px]">Adicionar</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files ?? [])
                        e.target.value = ''
                        for (const f of files) await handleAsset(f, 'screenshot')
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </Section>

          <Section
            title="Downloads"
            subtitle="Adicione uma linha por plataforma/arquitetura. Envie o arquivo ou cole o link direto."
            action={
              <button
                type="button"
                onClick={() => setRows((prev) => [...prev, emptyRow()])}
                className="flex items-center gap-1 rounded-md border border-line-strong px-2.5 py-1.5 text-[11.5px] font-medium text-ink transition hover:border-accent hover:text-accent-ink"
              >
                <PlusIcon className="size-3.5" /> Adicionar download
              </button>
            }
          >
            <div className="space-y-2.5">
              {rows.map((row, index) => (
                <div key={row.key} className="rounded-[var(--radius-card)] border border-line bg-surface-2 p-3">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-soft">
                      <OsIcon platform={row.platform} className="size-3.5" />
                      Download {index + 1}
                      {row.uploading && <span className="font-normal text-muted">· enviando…</span>}
                    </p>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                        className="flex items-center gap-1 text-[10.5px] text-muted hover:text-red-500"
                      >
                        <TrashIcon className="size-3" /> Remover
                      </button>
                    )}
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <label className="block">
                      <span className="mb-1 block text-[10.5px] text-muted">Plataforma</span>
                      <select
                        value={row.platform}
                        onChange={(e) => {
                          const p = e.target.value
                          updateRow(row.key, {
                            platform: p,
                            format: PLATFORMS[p]?.extensions[0] ?? row.format,
                            arch: p === 'android' || p === 'ios' ? 'universal' : row.arch,
                          })
                        }}
                        className="field"
                      >
                        {PLATFORM_KEYS.map((p) => (
                          <option key={p} value={p}>
                            {PLATFORMS[p].label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10.5px] text-muted">Arquitetura</span>
                      <select value={row.arch} onChange={(e) => updateRow(row.key, { arch: e.target.value })} className="field">
                        {ARCHES.map((a) => (
                          <option key={a} value={a}>
                            {archLabel(a)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10.5px] text-muted">Formato</span>
                      <input
                        value={row.format}
                        onChange={(e) => updateRow(row.key, { format: e.target.value.toLowerCase() })}
                        className="field"
                        placeholder="exe"
                        maxLength={12}
                      />
                    </label>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <Field label="Rótulo (opcional)">
                      <input
                        value={row.label}
                        onChange={(e) => updateRow(row.key, { label: e.target.value })}
                        className="field"
                        placeholder="Instalador para Windows 11"
                        maxLength={60}
                      />
                    </Field>
                    <Field label="Tamanho (MB) — opcional">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={row.fileSize ? (row.fileSize / 1024 / 1024).toFixed(1) : ''}
                        onChange={(e) => updateRow(row.key, { fileSize: Math.round((Number(e.target.value) || 0) * 1024 * 1024) })}
                        className="field"
                        placeholder="120"
                      />
                    </Field>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <Field label="URL do arquivo">
                      <input
                        value={row.url}
                        onChange={(e) => {
                          const value = e.target.value
                          updateRow(row.key, { url: value })
                          if (/^https?:\/\//i.test(value)) guessPlatform(row.key, value)
                        }}
                        className="field"
                        placeholder="https://github.com/.../app.exe"
                        inputMode="url"
                      />
                    </Field>
                    <div className="flex items-end">
                      <label className="flex h-[35px] cursor-pointer items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 text-[11.5px] font-medium text-ink transition hover:border-accent hover:text-accent-ink">
                        <UploadIcon className="size-3.5" />
                        {row.url ? 'Substituir' : 'Enviar arquivo'}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            e.target.value = ''
                            if (file) handleBinary(row, file)
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      value={row.minOs}
                      onChange={(e) => updateRow(row.key, { minOs: e.target.value })}
                      className="field max-w-[240px]"
                      placeholder="Sistema mínimo (ex.: Windows 10 21H2)"
                      maxLength={60}
                    />
                    <span className="text-[10.5px] text-muted">
                      {formatLabel(row.format)} · {archLabel(row.arch)}
                      {row.fileSize ? ` · ${formatBytes(row.fileSize)}` : ''}
                      {row.fileName ? ` · ${row.fileName}` : ''}
                    </span>
                  </div>

                  {row.sha256 && (
                    <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
                      <span className={`rounded-full border px-2 py-0.5 font-medium ${scanMeta(row.scanStatus).tone}`}>
                        {scanMeta(row.scanStatus).label}
                      </span>
                      <span className="font-mono" title={row.sha256}>
                        sha256 {shortHash(row.sha256, 20)}
                      </span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>

        <aside className="lg:sticky lg:top-4 lg:h-fit">
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Prévia do anúncio</p>
            <div className="mt-2.5 overflow-hidden rounded-lg border border-line">
              <div
                className="relative aspect-[16/9] w-full overflow-hidden"
                style={{
                  background: coverPreview
                    ? undefined
                    : `radial-gradient(120% 140% at 20% 0%, ${accent}55 0%, transparent 65%), var(--color-surface-2)`,
                }}
              >
                {coverPreview && <img src={coverPreview} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex items-start gap-2.5 p-2.5">
                <div
                  className="-mt-7 grid size-12 shrink-0 place-items-center overflow-hidden rounded-[12px] ring-1 ring-black/10"
                  style={{ background: accent }}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <GhostMark className="size-7" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold">{name.trim() || 'Nome do app'}</p>
                  <p className="truncate text-[10.5px] text-muted">{publisher.trim() || 'Publicador'}</p>
                  <p className="mt-1 line-clamp-2 text-[10.5px] leading-snug text-ink-soft">
                    {tagline.trim() || 'A descrição curta aparece aqui.'}
                  </p>
                </div>
              </div>
            </div>

            <dl className="mt-3 space-y-1.5 text-[11px]">
              <PreviewRow label="Categoria" value={category} />
              <PreviewRow label="Versão" value={version || '1.0.0'} />
              <PreviewRow label="Preço" value={priceCents ? `R$ ${(priceCents / 100).toFixed(2)}` : 'Grátis'} />
              <PreviewRow label="Classificação" value={ageRating} />
              <PreviewRow
                label="Plataformas"
                value={platforms.map((p) => PLATFORMS[p]?.label ?? p).join(', ') || '—'}
              />
              <PreviewRow label="Downloads" value={String(rows.filter((r) => r.url.trim()).length)} />
              <PreviewRow label="Capturas" value={String(screenshots.length)} />
            </dl>

            <button
              type="submit"
              disabled={submitting}
              className="glass-btn glass-btn-accent mt-3.5 flex w-full items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold disabled:cursor-not-allowed"
            >
              {submitting ? (editing ? 'Salvando…' : 'Publicando…') : editing ? 'Salvar alterações' : 'Publicar na loja'}
            </button>
            <p className="mt-2 text-center text-[10px] leading-relaxed text-muted">
              {editing
                ? `Editando como @${account.username}. Só quem publicou o app vê esta página.`
                : `Publicando como @${account.username}. O app fica visível na loja imediatamente.`}
            </p>
            {submitting && (
              <p className="mt-2 flex items-center justify-center gap-1 text-[10.5px] text-emerald-500">
                <CheckIcon className="size-3" /> {editing ? 'Salvando as alterações…' : 'Enviando arquivos e criando o anúncio…'}
              </p>
            )}
            <Link
              to={editing ? `/app/${slug}` : '/apps'}
              className="mt-2 block text-center text-[10.5px] text-muted hover:text-ink"
            >
              {editing ? 'Ver página do app' : 'Ver catálogo atual'}
            </Link>
          </div>
        </aside>
      </div>
    </form>
  )
}

function EditSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1220px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton mt-2 h-8 w-64 rounded" />
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-3">
          <div className="skeleton h-[260px] rounded-[var(--radius-card)]" />
          <div className="skeleton h-[220px] rounded-[var(--radius-card)]" />
        </div>
        <div className="skeleton h-[300px] rounded-[var(--radius-card)]" />
      </div>
    </div>
  )
}

function EditBlocked({ message }: { message: string }) {
  return (
    <div className="mx-auto w-full max-w-[520px] px-4 py-16 text-center">
      <GhostMark className="mx-auto size-12" glow />
      <h1 className="mt-4 font-display text-[20px] font-semibold">Não foi possível editar</h1>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{message}</p>
      <Link
        to="/library"
        className="glass-btn glass-btn-accent mt-5 inline-flex px-4 py-2 text-[12.5px] font-semibold"
      >
        Voltar para Meus apps
      </Link>
    </div>
  )
}

function AccountGate() {
  return (
    <div className="mx-auto w-full max-w-[520px] px-4 py-14 text-center sm:py-20">
      <GhostMark className="mx-auto size-14" glow />
      <h1 className="mt-4 font-display text-[22px] font-semibold tracking-[-0.02em]">
        Crie uma conta para publicar
      </h1>
      <p className="mx-auto mt-2 max-w-[400px] text-[12.5px] leading-relaxed text-muted">
        Navegar e baixar continua livre para todo mundo — só a publicação de apps pede uma conta. É rapidinho: nome de
        usuário único, senha e, se quiser, um e-mail.
      </p>
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        <Link
          to="/signin?mode=signup&next=/publish"
          className="glass-btn glass-btn-accent px-5 py-2.5 text-[13px] font-semibold"
        >
          Criar conta
        </Link>
        <Link
          to="/signin?next=/publish"
          className="glass-btn glass-btn-quiet px-4 py-2.5 text-[13px] font-semibold"
        >
          Já tenho conta
        </Link>
      </div>
    </div>
  )
}

function pickImage(e: ChangeEvent<HTMLInputElement>, cb: (file: File) => void) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (file) cb(file)
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-[14px] font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11.5px] text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11.5px] font-medium text-ink-soft">{label}</span>
        {hint && <span className="text-[10px] text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="truncate text-right font-medium text-ink">{value}</dd>
    </div>
  )
}
