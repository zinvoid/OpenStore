import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  addReview,
  addToLibrary,
  bestDownload,
  deleteApp,
  getApp,
  getReviews,
  listApps,
  trackDownload,
} from '../lib/api'
import type { AppWithDownloads, Download, Review } from '../lib/types'
import { PLATFORMS, archLabel, detectOS, formatLabel, osLabel, type OSKey } from '../lib/platform'
import { assetUrl, formatBytes, formatCount, formatDate, formatPrice, ratingLabel } from '../lib/format'
import { desktop, isDesktop, phaseLabel, shortPath, type InstalledApp, type ProgressEvent } from '../lib/desktop'
import { AppTile } from '../components/AppTile'
import { AppCard } from '../components/AppCard'
import { Stars } from '../components/Stars'
import { OsIcon } from '../components/OsIcon'
import {
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  EditIcon,
  FolderIcon,
  GlobeIcon,
  ShieldIcon,
  StarIcon,
  TrashIcon,
  VerifiedIcon,
} from '../components/Icons'
import { scanMeta, shortHash } from '../lib/security'
import { useAccount } from '../lib/auth'

type Tab = 'overview' | 'requirements' | 'reviews' | 'related'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Visão geral' },
  { key: 'requirements', label: 'Requisitos do sistema' },
  { key: 'reviews', label: 'Avaliações' },
  { key: 'related', label: 'Relacionados' },
]

const OS_OPTIONS: OSKey[] = ['windows', 'macos', 'linux', 'android']

export default function AppDetail() {
  const { slug = '' } = useParams()
  const [app, setApp] = useState<AppWithDownloads | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [related, setRelated] = useState<AppWithDownloads[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [os, setOs] = useState<OSKey>(() => detectOS())
  const [lightbox, setLightbox] = useState<string | null>(null)
  const detected = useMemo(() => detectOS(), [])
  const [installed, setInstalled] = useState<InstalledApp | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProgressEvent | null>(null)
  const [installError, setInstallError] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const account = useAccount()
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    setLoading(true)
    setNotFound(false)
    setTab('overview')
    getApp(slug)
      .then(async (data) => {
        if (!alive) return
        if (!data) {
          setNotFound(true)
          return
        }
        setApp(data)
        const [rv, rel] = await Promise.all([
          getReviews(data.id).catch(() => []),
          listApps({ category: data.category, excludeSlug: data.slug, limit: 10 }).catch(() => []),
        ])
        if (!alive) return
        setReviews(rv)
        setRelated(rel)
      })
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [slug])

  useEffect(() => {
    if (!desktop || !app) return
    let alive = true
    desktop
      .list()
      .then((list) => {
        if (alive) setInstalled(list.find((item) => item.slug === app.slug) ?? null)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [app])

  useEffect(() => {
    const stop = desktop?.onProgress((event) => {
      if (event.slug !== slug) return
      setProgress(event)
      if (event.phase === 'done') window.setTimeout(() => setProgress(null), 1500)
    })
    return stop
  }, [slug])

  async function handleInstall(d: Download) {
    if (!app) return
    if (!desktop) {
      handleDownload(d)
      return
    }
    setBusyId(d.id)
    setInstallError(null)
    try {
      const result = await desktop.install({
        slug: app.slug,
        name: app.name,
        version: d.version ?? app.version ?? '1.0.0',
        url: d.url,
        platform: d.platform,
        format: d.format,
        logoUrl: app.logo_url,
        accent: app.accent,
      })
      if (!result.ok) throw new Error(result.error)
      const list = await desktop.list()
      setInstalled(list.find((item) => item.slug === app.slug) ?? null)
      trackDownload(app.slug)
    } catch (error) {
      setInstallError((error as Error).message || 'Não foi possível instalar o app.')
    } finally {
      setBusyId(null)
    }
  }

  async function revealInstalled() {
    if (!app || !desktop) return
    setInstallError(null)
    const result = await desktop.reveal(app.slug)
    if (!result.ok) setInstallError(result.error ?? 'Não foi possível abrir a pasta do app.')
  }

  function handleDownload(d: Download) {
    if (!app) return
    trackDownload(app.slug)
    addToLibrary({
      slug: app.slug,
      name: app.name,
      version: d.version ?? app.version ?? '1.0.0',
      platform: d.platform,
      date: new Date().toISOString(),
      logoUrl: app.logo_url,
      accent: app.accent,
    })
    window.open(d.url, '_blank', 'noopener,noreferrer')
  }

  async function handleReview(author: string, rating: number, body: string) {
    if (!app) return
    await addReview(app.id, author, rating, body)
    const [rv, fresh] = await Promise.all([getReviews(app.id), getApp(app.slug)])
    setReviews(rv)
    if (fresh) setApp(fresh)
  }

  async function removeApp() {
    if (!app) return
    const confirmed = window.confirm(
      `Excluir ${app.name} da loja? O app e seus downloads saem do catálogo, e isso não pode ser desfeito.`,
    )
    if (!confirmed) return
    setRemoveError(null)
    setRemoving(true)
    try {
      await deleteApp(app.slug)
      navigate('/library')
    } catch (err) {
      setRemoveError((err as Error).message)
      setRemoving(false)
    }
  }

  if (loading) return <DetailSkeleton />
  if (notFound || !app) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-xl font-semibold">App não encontrado</h1>
        <p className="mt-2 text-[13px] text-muted">Talvez ele tenha sido removido ou o link esteja incorreto.</p>
        <Link to="/apps" className="glass-btn glass-btn-accent mt-6 inline-flex px-4 py-2 text-[13px] font-semibold">
          Explorar a loja
        </Link>
      </div>
    )
  }

  const chosen = bestDownload(app, os)
  const isOwner = Boolean(account?.id && app.owner_id && account.id === app.owner_id)
  const cover = assetUrl(app.cover_url)
  const screenshots = (app.screenshots ?? []).map((s) => assetUrl(s)!).filter(Boolean)
  const gallery = screenshots.length ? screenshots : cover ? [cover] : []

  return (
    <div>
      {/* cabeçalho com capa */}
      <div className="relative">
        <div className="relative h-[190px] overflow-hidden bg-surface-2 sm:h-[244px]">
          {cover ? (
            <img
              src={cover}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-[1.3] object-cover blur-[18px] saturate-125"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(110% 150% at 12% 0%, ${app.accent ?? '#7c5cff'}66 0%, transparent 62%)`,
              }}
            />
          )}
          {/* brilho da cor de destaque do app */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(85% 130% at 8% 0%, ${app.accent ?? '#7c5cff'}45 0%, transparent 60%)`,
            }}
          />
          {/* véu que funde o banner com o fundo da página */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/65 to-bg/20" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-bg/80 via-bg/10 to-transparent" />
        </div>

        {/* z-10 mantém ícone, título e painel acima dos véus do banner */}
        <div className="relative z-10 mx-auto w-full max-w-[1220px] px-4 sm:px-6 lg:px-8">
          <div className="-mt-[86px] flex flex-col gap-5 sm:-mt-[96px] lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-end gap-4">
              <AppTile app={app} size={108} radius={24} glow className="ring-1 ring-white/25" />
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-[24px] font-semibold leading-tight tracking-[-0.02em] sm:text-[30px]">
                    {app.name}
                  </h1>
                  {app.verified && <VerifiedIcon className="size-4 text-accent" title="Editor verificado" />}
                  {app.price_cents === 0 && (
                    <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-500">
                      GRÁTIS
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[12.5px] text-muted">
                  {app.publisher} · {app.category} · v{app.version ?? '1.0.0'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <Stars value={Number(app.rating)} size={12} />
                    <span className="font-medium text-ink">{Number(app.rating).toFixed(1)}</span>
                    <span>({formatCount(app.rating_count)} avaliações)</span>
                  </span>
                  <span className="hidden h-3 w-px bg-line-strong sm:block" />
                  <span className="hidden sm:inline">{formatCount(app.downloads_count)} downloads</span>
                  <span className="hidden h-3 w-px bg-line-strong sm:block" />
                  <span>{app.age_rating}</span>
                </div>
                {isOwner && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <Link
                      to={`/publish/${app.slug}`}
                      className="glass-btn glass-btn-quiet px-2.5 py-1 text-[11px] font-medium"
                    >
                      <EditIcon className="size-3.5" /> Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => void removeApp()}
                      disabled={removing}
                      className="glass-btn glass-btn-quiet px-2.5 py-1 text-[11px] font-medium text-rose-500 disabled:opacity-50"
                    >
                      <TrashIcon className="size-3.5" /> {removing ? 'Excluindo…' : 'Excluir'}
                    </button>
                    {removeError && <span className="text-[11px] text-rose-500">{removeError}</span>}
                  </div>
                )}
              </div>
            </div>

            <DownloadPanel
              app={app}
              os={os}
              setOs={setOs}
              detected={detected}
              chosen={chosen}
              onAction={(d) => void handleInstall(d)}
              onReveal={() => void revealInstalled()}
              installed={installed}
              busy={Boolean(busyId)}
              progress={progress}
              error={installError}
            />
          </div>
        </div>
      </div>

      {/* abas */}
      <div className="sticky top-0 z-10 mt-6 border-b border-line bg-bg">
        <div className="mx-auto flex w-full max-w-[1220px] items-center gap-1 overflow-x-auto px-4 no-scrollbar sm:px-6 lg:px-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative shrink-0 px-3 py-3 text-[12.5px] font-medium transition ${
                tab === t.key ? 'text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {t.label}
              {t.key === 'reviews' && reviews.length > 0 && (
                <span className="ml-1 text-[10.5px] text-muted">{reviews.length}</span>
              )}
              {tab === t.key && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-accent" />}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1220px] px-4 py-6 sm:px-6 lg:px-8">
        {tab === 'overview' && (
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_296px]">
            <div className="min-w-0 space-y-8">
              {gallery.length > 0 && (
                <section>
                  <div className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
                    {gallery.map((src, i) => (
                      <button
                        key={`${src}-${i}`}
                        type="button"
                        onClick={() => setLightbox(src)}
                        className="group relative w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-surface-2/40 sm:w-[400px]"
                      >
                        <img
                          src={src}
                          alt={`Captura de tela ${i + 1} de ${app.name}`}
                          className="aspect-video w-full object-cover transition group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="font-display text-[16px] font-semibold">Sobre este app</h2>
                <div className="mt-2.5 space-y-3 text-[13px] leading-relaxed text-ink-soft">
                  {(app.description ?? app.tagline ?? '')
                    .split(/\n{2,}/)
                    .filter(Boolean)
                    .map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                </div>
                {app.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {app.tags.map((tag) => (
                      <Link
                        key={tag}
                        to={`/apps?q=${encodeURIComponent(tag)}`}
                        className="glass-chip !px-2.5 !py-1 !text-[11px] !text-muted transition hover:!text-ink"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {app.whats_new && (
                <section className="glass-card p-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent-ink">
                      NOVIDADES
                    </span>
                    <p className="text-[11.5px] text-muted">Versão {app.version}</p>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{app.whats_new}</p>
                </section>
              )}

              <section>
                <h2 className="font-display text-[16px] font-semibold">Downloads disponíveis</h2>
                <p className="mt-1 text-[12px] text-muted">
                  O OpenStore escolheu automaticamente a versão para {osLabel(detected)}. Você pode baixar qualquer
                  outra.
                </p>
                <div className="glass-card mt-3 overflow-hidden p-1">
                  {(app.app_downloads ?? []).map((d) => (
                    <div
                      key={d.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/10 dark:hover:bg-white/[0.04]"
                    >
                      <OsIcon platform={d.platform} className="size-4 text-ink-soft" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium text-ink">
                          {d.label ?? `${PLATFORMS[d.platform]?.label ?? d.platform} ${archLabel(d.arch)}`}
                        </p>
                        <p className="text-[11px] text-muted">
                          {formatLabel(d.format)} · {archLabel(d.arch)} · {formatBytes(d.file_size)}
                          {d.min_os ? ` · ${d.min_os}` : ''}
                        </p>
                      </div>
                      {d.scan_status && d.scan_status !== 'pendente' && (
                        <span
                          className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline ${scanMeta(d.scan_status).tone}`}
                        >
                          {scanMeta(d.scan_status).label}
                        </span>
                      )}
                      {chosen?.id === d.id && (
                        <span className="hidden items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 sm:flex">
                          <CheckIcon className="size-3" /> Recomendado
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleInstall(d)}
                        className="glass-btn px-3 py-1.5 text-[11.5px] font-medium"
                      >
                        {isDesktop ? 'Instalar' : 'Baixar'}
                      </button>
                    </div>
                  ))}
                  {!app.app_downloads?.length && (
                    <p className="px-3.5 py-4 text-[12.5px] text-muted">Este app ainda não tem downloads publicados.</p>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-3">
              <div className="glass-card p-4">
                <h3 className="text-[12.5px] font-semibold text-ink">Informações adicionais</h3>
                <dl className="mt-3 space-y-2.5 text-[11.5px]">
                  <InfoRow label="Editor" value={app.publisher} />
                  <InfoRow label="Versão" value={app.version ?? '—'} />
                  <InfoRow label="Tamanho" value={formatBytes(chosen?.file_size ?? app.app_downloads?.[0]?.file_size)} />
                  <InfoRow label="Categoria" value={app.category} />
                  <InfoRow
                    label="Plataformas"
                    value={(app.platforms ?? []).map((p) => PLATFORMS[p]?.label ?? p).join(', ') || '—'}
                  />
                  <InfoRow label="Idiomas" value={(app.languages ?? []).join(', ') || '—'} />
                  <InfoRow label="Classificação" value={app.age_rating ?? 'Livre'} />
                  <InfoRow label="Publicado em" value={formatDate(app.created_at)} />
                </dl>
                <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-3">
                  {app.website && (
                    <a
                      href={app.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded px-1.5 py-1 text-[11.5px] text-accent-ink hover:bg-accent-soft"
                    >
                      <GlobeIcon className="size-3.5" /> Site oficial
                    </a>
                  )}
                  {app.support_url && (
                    <a
                      href={app.support_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded px-1.5 py-1 text-[11.5px] text-muted hover:bg-surface-2 hover:text-ink"
                    >
                      <GlobeIcon className="size-3.5" /> Suporte do desenvolvedor
                    </a>
                  )}
                </div>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center gap-1.5">
                  <ShieldIcon className="size-3.5 text-accent-ink" />
                  <h3 className="text-[12.5px] font-semibold">Segurança do arquivo</h3>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${scanMeta(chosen?.scan_status).tone}`}>
                    {scanMeta(chosen?.scan_status).label}
                  </span>
                  {chosen?.scan_engine && <span className="text-[10.5px] text-muted">{chosen.scan_engine}</span>}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted">{scanMeta(chosen?.scan_status).hint}</p>
                <dl className="mt-2.5 space-y-1.5 text-[11px]">
                  <div className="flex items-start justify-between gap-2">
                    <dt className="shrink-0 text-muted">SHA-256</dt>
                    <dd className="truncate font-mono text-[10px] text-ink-soft" title={chosen?.sha256 ?? ''}>
                      {shortHash(chosen?.sha256, 22)}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <dt className="shrink-0 text-muted">Verificado em</dt>
                    <dd className="text-right font-medium text-ink">
                      {chosen?.scan_at ? formatDate(chosen.scan_at) : '—'}
                    </dd>
                  </div>
                </dl>
                {!isDesktop && (
                  <p className="mt-2 border-t border-line pt-2 text-[10.5px] leading-relaxed text-muted">
                    No app do desktop, o instalador é analisado com o ClamAV da sua máquina antes de ser aberto.
                  </p>
                )}
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12.5px] font-semibold">Avaliação geral</h3>
                  <span className="text-[11px] text-muted">{ratingLabel(Number(app.rating))}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-display text-[28px] font-semibold leading-none">
                    {Number(app.rating).toFixed(1)}
                  </span>
                  <div>
                    <Stars value={Number(app.rating)} size={13} />
                    <p className="mt-0.5 text-[11px] text-muted">{formatCount(app.rating_count)} avaliações</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('reviews')}
                  className="mt-3 w-full rounded-md border border-line-strong py-1.5 text-[11.5px] font-medium hover:border-accent hover:text-accent-ink"
                >
                  Escrever avaliação
                </button>
              </div>

              {related.length > 0 && (
                <div className="glass-card p-4">
                  <h3 className="text-[12.5px] font-semibold">Apps semelhantes</h3>
                  <div className="mt-3 space-y-2.5">
                    {related.slice(0, 4).map((r) => (
                      <Link key={r.id} to={`/app/${r.slug}`} className="flex items-center gap-2.5 rounded p-1 hover:bg-surface-2">
                        <AppTile app={r} size={32} radius={8} />
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium">{r.name}</p>
                          <p className="truncate text-[10.5px] text-muted">{r.publisher}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {tab === 'requirements' && (
          <div className="max-w-3xl space-y-4">
            <h2 className="font-display text-[16px] font-semibold">Requisitos do sistema</h2>
            <div className="glass-card overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-white/10 text-[11px] uppercase tracking-[0.08em] text-muted dark:bg-white/[0.04]">
                  <tr>
                    <th className="px-3.5 py-2.5 font-medium">Plataforma</th>
                    <th className="px-3.5 py-2.5 font-medium">Arquitetura</th>
                    <th className="px-3.5 py-2.5 font-medium">Formato</th>
                    <th className="px-3.5 py-2.5 font-medium">Tamanho</th>
                    <th className="px-3.5 py-2.5 font-medium">Sistema mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {(app.app_downloads ?? []).map((d) => (
                    <tr key={d.id} className="border-t border-line transition hover:bg-white/10 dark:hover:bg-white/[0.03]">
                      <td className="px-3.5 py-2.5">
                        <span className="flex items-center gap-2">
                          <OsIcon platform={d.platform} className="size-3.5" />
                          {PLATFORMS[d.platform]?.label ?? d.platform}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-muted">{archLabel(d.arch)}</td>
                      <td className="px-3.5 py-2.5 text-muted">{formatLabel(d.format)}</td>
                      <td className="px-3.5 py-2.5 text-muted">{formatBytes(d.file_size)}</td>
                      <td className="px-3.5 py-2.5 text-muted">{d.min_os ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11.5px] text-muted">
              O download recomendado depende do sistema detectado no seu dispositivo. Use o seletor na página para
              simular outro sistema operacional.
            </p>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <h2 className="font-display text-[16px] font-semibold">
                Avaliações <span className="text-muted">({reviews.length})</span>
              </h2>
              {reviews.length === 0 && (
                <p className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-white/10 p-6 dark:bg-white/[0.03] text-center text-[12.5px] text-muted">
                  Ninguém avaliou ainda. Seja o primeiro a contar como foi.
                </p>
              )}
              <div className="space-y-2.5">
                {reviews.map((r) => (
                  <div key={r.id} className="glass-card p-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-ink">
                        {r.author.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-[12px] font-medium">{r.author}</p>
                        <p className="text-[10.5px] text-muted">{formatDate(r.created_at)}</p>
                      </div>
                      <Stars value={r.rating} className="ml-auto" />
                    </div>
                    {r.body && <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">{r.body}</p>}
                  </div>
                ))}
              </div>
            </div>
            <ReviewForm onSubmit={handleReview} ratingCount={reviews.length} rating={Number(app.rating)} reviews={reviews} />
          </div>
        )}

        {tab === 'related' && (
          <div>
            <h2 className="font-display text-[16px] font-semibold">
              Relacionados a {app.category}
            </h2>
            {related.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-muted">Nenhum app relacionado por enquanto.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {related.map((r) => (
                  <AppCard key={r.id} app={r} width={null} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {lightbox && (
        <button
          type="button"
          aria-label="Fechar imagem"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
        >
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-lg shadow-2xl" />
        </button>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  )
}

function DownloadPanel({
  app,
  os,
  setOs,
  detected,
  chosen,
  onAction,
  onReveal,
  installed,
  busy,
  progress,
  error,
}: {
  app: AppWithDownloads
  os: OSKey
  setOs: (os: OSKey) => void
  detected: OSKey
  chosen: Download | null
  onAction: (d: Download) => void
  onReveal: () => void
  installed: InstalledApp | null
  busy: boolean
  progress: ProgressEvent | null
  error: string | null
}) {
  const [open, setOpen] = useState(false)
  const all = app.app_downloads ?? []
  const canReveal = Boolean(installed?.exePath || installed?.installDir)

  return (
    <div className="glass-card w-full p-3.5 lg:w-[338px]">
      {canReveal ? (
        <button
          type="button"
          onClick={onReveal}
          title={installed?.installDir ?? ''}
          className="glass-btn glass-btn-accent flex w-full items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold"
        >
          <FolderIcon className="size-4" />
          Abrir local
        </button>
      ) : chosen ? (
        <button
          type="button"
          onClick={() => onAction(chosen)}
          disabled={busy}
          className="glass-btn glass-btn-accent flex w-full items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold disabled:cursor-progress"
        >
          <DownloadIcon className="size-4" />
          {busy
            ? 'Instalando…'
            : `${isDesktop ? 'Instalar' : 'Baixar'} para ${PLATFORMS[os]?.label ?? 'seu sistema'}${
                chosen.format ? ` · ${formatLabel(chosen.format)}` : ''
              }`}
        </button>
      ) : (
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-xl border border-line-strong bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-muted dark:bg-white/[0.04]"
        >
          Indisponível para {PLATFORMS[os]?.label ?? 'este sistema'}
        </button>
      )}
      <p className="mt-2 text-center text-[11px] text-muted">
        {chosen
          ? `${formatLabel(chosen.format)} · ${archLabel(chosen.arch)} · ${formatBytes(chosen.file_size)}${
              app.price_cents ? ` · ${formatPrice(app.price_cents, app.currency)}` : ' · Grátis'
            }`
          : `${all.length} ${all.length === 1 ? 'versão disponível' : 'versões disponíveis'} para outras plataformas`}
      </p>

      {progress && <p className="mt-1.5 text-center text-[11px] font-medium text-accent-ink">{phaseLabel(progress)}</p>}
      {installed && (
        <p className="mt-1 text-center text-[10.5px] text-muted">
          Instalado em <span className="font-mono text-[10px]">{shortPath(installed.installDir, 34)}</span> ·{' '}
          <Link to="/library" className="font-medium text-accent-ink hover:underline">
            gerenciar
          </Link>
        </p>
      )}
      {error && <p className="mt-1.5 text-center text-[11px] text-red-500">{error}</p>}

      <div className="glass-inset mt-3 flex items-center gap-2 px-2 py-1.5">
        <OsIcon platform={detected} className="size-3.5 text-muted" />
        <span className="text-[10.5px] text-muted">
          Detectado: <span className="font-medium text-ink">{osLabel(detected)}</span>
        </span>
        <select
          aria-label="Simular outro sistema"
          value={os}
          onChange={(e) => setOs(e.target.value as OSKey)}
          className="ml-auto rounded-lg border border-line bg-white/40 px-1.5 py-0.5 text-[10.5px] text-ink outline-none dark:bg-white/[0.06]"
        >
          {OS_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {PLATFORMS[p].label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2.5 flex w-full items-center justify-center gap-1 rounded py-1 text-[11.5px] font-medium text-accent-ink hover:bg-accent-soft"
      >
        {open ? 'Ocultar plataformas' : 'Ver todas as plataformas'}
        <ChevronDownIcon className={`size-3.5 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-1.5 max-h-[220px] space-y-1 overflow-y-auto scroll-area pr-1">
          {all.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onAction(d)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-surface-2"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-ink">
                <OsIcon platform={d.platform} className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11.5px] font-medium text-ink">
                  {d.label ?? `${PLATFORMS[d.platform]?.label ?? d.platform}`}
                </span>
                <span className="block truncate text-[10px] text-muted">
                  {formatLabel(d.format)} · {archLabel(d.arch)} · {formatBytes(d.file_size)}
                </span>
              </span>
              <DownloadIcon className="size-3.5 shrink-0 text-muted" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewForm({
  onSubmit,
  ratingCount,
  rating,
  reviews,
}: {
  onSubmit: (author: string, rating: number, body: string) => Promise<void>
  ratingCount: number
  rating: number
  reviews: Review[]
}) {
  const [author, setAuthor] = useState('')
  const [ratingValue, setRatingValue] = useState(5)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))
  const total = reviews.length || 1

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    try {
      await onSubmit(author.trim() || 'Anônimo', ratingValue, body.trim())
      setBody('')
      setAuthor('')
      setRatingValue(5)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="space-y-3">
      <div className="glass-card p-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[34px] font-semibold leading-none">{rating.toFixed(1)}</span>
          <span className="text-[11.5px] text-muted">de 5</span>
        </div>
        <Stars value={rating} size={13} className="mt-1" />
        <p className="mt-1 text-[11px] text-muted">{ratingCount} avaliações no total</p>
        <div className="mt-3 space-y-1.5">
          {distribution.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="flex w-6 items-center gap-0.5 text-[10.5px] text-muted">
                {star}
                <StarIcon className="size-2.5" />
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${Math.round((count / total) * 100)}%` }}
                />
              </div>
              <span className="w-5 text-right text-[10px] text-muted">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="glass-card p-4">
        <p className="text-[12.5px] font-semibold">Avaliar este app</p>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} estrelas`}
              onClick={() => setRatingValue(n)}
              className={`transition ${n <= ratingValue ? 'text-amber-400' : 'text-muted/40 hover:text-amber-300'}`}
            >
              <StarIcon className="size-5" />
            </button>
          ))}
        </div>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Seu nome (opcional)"
          className="field mt-3"
          maxLength={40}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="O que você achou?"
          className="field mt-2 min-h-[88px] resize-y"
          maxLength={800}
          required
        />
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="glass-btn glass-btn-accent mt-2.5 w-full py-2 text-[12.5px] font-semibold disabled:cursor-not-allowed"
        >
          {busy ? 'Enviando...' : 'Publicar avaliação'}
        </button>
        {done && (
          <p className="mt-2 flex items-center gap-1 text-[11.5px] text-emerald-500">
            <CheckIcon className="size-3.5" /> Avaliação publicada!
          </p>
        )}
      </form>
    </aside>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1220px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="skeleton h-[180px] rounded-[14px]" />
      <div className="mt-4 flex items-center gap-4">
        <div className="skeleton size-[104px] rounded-[22px]" />
        <div className="space-y-2">
          <div className="skeleton h-6 w-52 rounded" />
          <div className="skeleton h-3 w-40 rounded" />
        </div>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_296px]">
        <div className="space-y-3">
          <div className="skeleton h-[220px] rounded-lg" />
          <div className="skeleton h-4 w-2/3 rounded" />
          <div className="skeleton h-4 w-full rounded" />
        </div>
        <div className="skeleton h-[260px] rounded-lg" />
      </div>
    </div>
  )
}
