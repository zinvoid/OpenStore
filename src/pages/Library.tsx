import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { deleteApp, getApp, listMyApps, readLibrary, type InstalledEntry } from '../lib/api'
import type { AppWithDownloads, Download } from '../lib/types'
import {
  desktop,
  isDesktop,
  phaseLabel,
  shortPath,
  useInstalledApps,
  type DetectedInstall,
  type InstalledApp,
  type ProgressEvent,
} from '../lib/desktop'
import { PLATFORMS, archLabel, formatLabel } from '../lib/platform'
import { accentFromString, assetUrl, formatBytes, formatDate } from '../lib/format'
import { useAccount } from '../lib/auth'
import { AppTile } from '../components/AppTile'
import { GhostMark } from '../components/GhostLogo'
import { DesktopPromo } from '../components/DesktopPromo'
import {
  DownloadIcon,
  EditIcon,
  FolderIcon,
  LibraryIcon,
  MoreIcon,
  PlayIcon,
  ShieldIcon,
  SyncIcon,
  TrashIcon,
} from '../components/Icons'

export default function Library() {
  return (
    <div className="mx-auto w-full max-w-[1220px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-ink">Sua coleção</p>
          <h1 className="mt-1 font-display text-[26px] font-semibold tracking-[-0.02em]">Meus apps</h1>
          <p className="mt-1 text-[12.5px] text-muted">
            Seus apps instalados e os que você publicou, com edição à mão.
          </p>
        </div>
        <Link
          to="/apps"
          className="glass-btn glass-btn-accent px-4 py-2 text-[12px] font-semibold"
        >
          Instalar mais apps
        </Link>
      </div>

      <OwnedApps />
      {isDesktop ? <InstalledApps /> : <DownloadedApps />}
    </div>
  )
}

// --------------------------------------------------------- apps publicados

function OwnedApps() {
  const account = useAccount()
  const [apps, setApps] = useState<AppWithDownloads[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (!account) {
      setApps([])
      return
    }
    let alive = true
    setLoading(true)
    listMyApps(account.id)
      .then((list) => alive && setApps(list))
      .catch(() => alive && setApps([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [account])

  async function remove(app: AppWithDownloads) {
    const confirmed = window.confirm(
      `Excluir ${app.name} da loja? O app e seus downloads saem do catálogo, e isso não pode ser desfeito.`,
    )
    if (!confirmed) return
    setError(null)
    setRemoving(app.slug)
    try {
      await deleteApp(app.slug)
      setApps((list) => list.filter((item) => item.slug !== app.slug))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setRemoving(null)
    }
  }

  if (!account) return null

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-[15px] font-semibold">Apps que você publicou</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">
            Você pode editar textos, arte, versão e downloads a qualquer momento.
          </p>
        </div>
        <Link
          to="/publish"
          className="glass-btn glass-btn-quiet px-3 py-1.5 text-[11.5px] font-medium"
        >
          Publicar novo app
        </Link>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11.5px] text-rose-500">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton h-[188px] rounded-2xl" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-line-strong bg-surface/50 px-4 py-6 text-center text-[12px] text-muted backdrop-blur">
          Você ainda não publicou nenhum app. Quando publicar, ele aparece aqui com o botão <strong>Editar</strong>.
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {apps.map((app) => (
            <article
              key={app.id}
              className="glass-card relative flex flex-col has-[[aria-expanded=true]]:z-30"
            >
              <div className="banner-fade relative h-[104px] overflow-hidden rounded-t-[21px]">
                {app.cover_url ? (
                  <>
                    <img
                      src={assetUrl(app.cover_url)}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full scale-125 object-cover opacity-45 blur-xl"
                    />
                    <img
                      src={assetUrl(app.cover_url)}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-cover object-[50%_35%]"
                    />
                  </>
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(120% 150% at 15% 0%, ${app.accent ?? '#7c5cff'}66, transparent 72%), radial-gradient(90% 120% at 90% 100%, ${app.accent ?? '#7c5cff'}3d, transparent 70%)`,
                    }}
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0a14]/40 via-transparent to-transparent" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
              </div>

              <div className="relative -mt-8 flex flex-1 flex-col px-4 pb-4">
                <div className="flex items-end gap-2.5">
                  <AppTile app={app} size={50} radius={13} glow />
                  <div className="min-w-0 pb-0.5">
                    <Link
                      to={`/app/${app.slug}`}
                      className="block truncate text-[13px] font-semibold leading-tight hover:text-accent-ink"
                    >
                      {app.name}
                    </Link>
                    <p className="mt-0.5 truncate text-[10.5px] text-muted">
                      v{app.version ?? '1.0.0'} · {app.category}
                    </p>
                  </div>
                </div>

                <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-ink-soft">
                  {app.tagline ?? 'Sem descrição curta.'}
                </p>

                <div className="mt-3 flex items-center gap-1.5">
                  <Link
                    to={`/publish/${app.slug}`}
                    className="glass-btn glass-btn-accent flex-1 px-3 py-2 text-[11.5px] font-semibold"
                  >
                    <EditIcon className="size-3.5" /> Editar
                  </Link>
                  <CardMenu
                    items={[
                      { label: 'Ver página do app', to: `/app/${app.slug}` },
                      { label: 'Gerenciar downloads', to: `/publish/${app.slug}` },
                      {
                        label: removing === app.slug ? 'Excluindo…' : 'Excluir app',
                        icon: <TrashIcon className="size-3.5" />,
                        danger: true,
                        onClick: () => void remove(app),
                      },
                      {
                        label: 'Copiar link do app',
                        onClick: () => void navigator.clipboard?.writeText(`${window.location.origin}/#/app/${app.slug}`),
                      },
                    ]}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------- apps instalados

function InstalledApps() {
  const { apps, refresh, loading } = useInstalledApps()
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [progress, setProgress] = useState<ProgressEvent | null>(null)
  const [detected, setDetected] = useState<{ slug: string; results: DetectedInstall[] } | null>(null)
  const [versions, setVersions] = useState<{ slug: string; downloads: Download[] } | null>(null)

  useEffect(() => {
    const off = desktop?.onProgress((event) => {
      setProgress(event)
      if (event.phase === 'done') window.setTimeout(() => setProgress(null), 1500)
    })
    return off
  }, [])

  function flash(kind: 'ok' | 'error', text: string) {
    setNotice({ kind, text })
    window.setTimeout(() => setNotice(null), 6000)
  }

  async function run(slug: string, task: () => Promise<string | void>) {
    setBusy(slug)
    setNotice(null)
    try {
      const message = await task()
      if (message) flash('ok', message)
    } catch (error) {
      flash('error', (error as Error).message || 'Algo deu errado.')
    } finally {
      setBusy(null)
      await refresh()
    }
  }

  function openApp(item: InstalledApp) {
    void run(item.slug, async () => {
      const result = await desktop!.launch(item.slug)
      if (!result.ok) throw new Error(result.error)
    })
  }

  function reveal(item: InstalledApp) {
    void run(item.slug, async () => {
      const result = await desktop!.reveal(item.slug)
      if (!result.ok) throw new Error(result.error)
    })
  }

  function uninstall(item: InstalledApp) {
    void run(item.slug, async () => {
      const confirmed = window.confirm(
        `Desinstalar ${item.name}? O desinstalador do app será executado e ele sairá da OpenStore.`,
      )
      if (!confirmed) return
      const result = await desktop!.uninstall(item.slug)
      if (!result.ok) throw new Error(result.error)
      setDetected(null)
      setVersions(null)
      return `${item.name} foi desinstalado.`
    })
  }

  function move(item: InstalledApp) {
    void run(item.slug, async () => {
      const target = await desktop!.chooseFolder(item.slug)
      if (!target) return
      const result = await desktop!.move(item.slug, target)
      if (!result.ok) throw new Error(result.error)
      return `Novo local: ${result.entry?.installDir ?? target}`
    })
  }

  async function detect(item: InstalledApp) {
    setBusy(item.slug)
    setNotice(null)
    try {
      const result = await desktop!.detect({ slug: item.slug, name: item.name })
      if (!result.ok) throw new Error(result.error)
      if (!result.results.length) {
        flash('error', `Não encontramos nenhuma instalação de ${item.name} no Windows.`)
      } else {
        setDetected({ slug: item.slug, results: result.results })
      }
    } catch (error) {
      flash('error', (error as Error).message || 'A busca automática falhou.')
    } finally {
      setBusy(null)
    }
  }

  function applyCandidate(item: InstalledApp, candidate: DetectedInstall) {
    void run(item.slug, async () => {
      const result = await desktop!.apply({ slug: item.slug, candidate })
      if (!result.ok) throw new Error(result.error)
      setDetected(null)
      return `Executável atualizado para ${candidate.installLocation ?? candidate.exePath ?? item.name}.`
    })
  }

  async function toggleVersions(item: InstalledApp) {
    if (versions?.slug === item.slug) {
      setVersions(null)
      return
    }
    setBusy(item.slug)
    try {
      const app = await getApp(item.slug)
      setVersions({ slug: item.slug, downloads: app?.app_downloads ?? [] })
    } catch {
      flash('error', 'Não foi possível carregar as versões deste app.')
    } finally {
      setBusy(null)
    }
  }

  async function scanWithClamav(item: InstalledApp) {
    setBusy(item.slug)
    setNotice(null)
    try {
      const result = await desktop!.scan(item.slug)
      if (result.verdict === 'limpo') flash('ok', `ClamAV: nenhuma ameaça encontrada em ${item.name}.`)
      else if (result.verdict === 'infectado')
        flash('error', `ClamAV encontrou uma ameaça em ${item.name}. Não abra este app.`)
      else if (result.verdict === 'indisponivel')
        flash('error', 'O ClamAV não está instalado neste PC. Instale o ClamAV para analisar os arquivos.')
      else flash('error', result.output || 'A análise com ClamAV não pôde ser concluída.')
    } catch (error) {
      flash('error', (error as Error).message || 'A análise com ClamAV falhou.')
    } finally {
      setBusy(null)
      await refresh()
    }
  }

  function installVersion(item: InstalledApp, download: Download) {
    void run(item.slug, async () => {
      const result = await desktop!.install({
        slug: item.slug,
        name: item.name,
        version: download.version ?? item.version,
        url: download.url,
        platform: download.platform,
        format: download.format,
        logoUrl: item.logoUrl,
        accent: item.accent,
      })
      if (!result.ok) throw new Error(result.error)
      setVersions(null)
      return `${item.name} ${download.version ?? ''} instalado.`
    })
  }

  return (
    <section className="mt-7">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-[15px] font-semibold">Instalados neste PC</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">
            Abra com um clique, veja ou mude a pasta, busque o executável e troque de versão.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="glass-btn glass-btn-quiet px-3 py-1.5 text-[11.5px] font-medium"
        >
          Atualizar lista
        </button>
      </div>

      {notice && (
        <div
          className={`mt-3 rounded-[var(--radius-card)] border px-3.5 py-2.5 text-[12px] ${
            notice.kind === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {notice.text}
        </div>
      )}

      {loading ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-[188px] rounded-2xl" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface/50 px-6 py-12 text-center backdrop-blur">
          <span className="grid size-16 place-items-center rounded-2xl bg-accent-soft">
            <GhostMark className="size-10" />
          </span>
          <h3 className="mt-3 font-display text-[16px] font-semibold">Nenhum app instalado ainda</h3>
          <p className="mt-1 max-w-[420px] text-[12px] leading-relaxed text-muted">
            Instale um app pela loja e ele vira um cartão aqui: abrir, local, mover, buscar o executável, versões e
            desinstalar.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link to="/apps" className="glass-btn glass-btn-accent px-4 py-2 text-[12.5px] font-semibold">
              Explorar catálogo
            </Link>
            <Link
              to="/publish"
              className="glass-btn glass-btn-quiet px-4 py-2 text-[12.5px] font-medium"
            >
              Publicar meu app
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {apps.map((item) => {
            const running = busy === item.slug
            const live = progress?.slug === item.slug ? phaseLabel(progress) : null
            const missingExe = !item.exePath
            const accent = item.accent || accentFromString(item.name)

            return (
              <article
                key={item.slug}
                className="glass-card group relative flex flex-col has-[[aria-expanded=true]]:z-30"
              >
                <div className="banner-fade relative h-[104px] overflow-hidden rounded-t-[21px]">
                  {item.logoUrl ? (
                    <img
                      src={assetUrl(item.logoUrl)}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full scale-150 object-cover opacity-50 blur-2xl"
                    />
                  ) : null}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(120% 150% at 15% 0%, ${accent}77, transparent 72%)`,
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0a14]/50 via-transparent to-transparent" />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
                </div>

                <div className="absolute right-2.5 top-2.5 z-20">
                  <CardMenu
                    disabled={running}
                    items={[
                      { label: 'Abrir pasta local', icon: <FolderIcon className="size-3.5" />, onClick: () => reveal(item) },
                      { label: 'Modificar local', icon: <FolderIcon className="size-3.5" />, onClick: () => move(item) },
                      { label: 'Buscar automaticamente', icon: <SyncIcon className="size-3.5" />, onClick: () => void detect(item) },
                      { label: 'Baixar outra versão', icon: <DownloadIcon className="size-3.5" />, onClick: () => void toggleVersions(item) },
                      {
                        label: 'Verificar com ClamAV',
                        icon: <ShieldIcon className="size-3.5" />,
                        onClick: () => void scanWithClamav(item),
                      },
                      {
                        label: 'Desinstalar',
                        icon: <TrashIcon className="size-3.5" />,
                        danger: true,
                        onClick: () => uninstall(item),
                      },
                    ]}
                  />
                </div>

                <div className="relative -mt-8 flex flex-1 flex-col px-4 pb-4">
                  <div className="flex items-end gap-3">
                    <div className="rounded-[15px] ring-1 ring-white/20 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.8)]">
                      <AppTile
                        app={{ name: item.name, logo_url: item.logoUrl ?? null, accent: item.accent ?? null }}
                        size={52}
                        radius={15}
                        glow
                      />
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <Link
                        to={`/app/${item.slug}`}
                        className="block truncate font-display text-[14px] font-semibold leading-tight tracking-[-0.01em] transition hover:text-accent-ink"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 truncate text-[10.5px] text-muted">
                        v{item.version} · {PLATFORMS[item.platform]?.label ?? formatLabel(item.platform)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="glass-chip">{item.kind === 'arquivo' ? 'Portátil' : 'Instalado'}</span>
                    {item.security?.verdict && item.security.verdict !== 'indisponivel' && (
                      <span
                        className={`glass-chip ${
                          item.security.verdict === 'infectado'
                            ? '!border-red-400/40 !text-red-500 dark:!text-red-300'
                            : '!border-emerald-400/30 !text-emerald-600 dark:!text-emerald-300'
                        }`}
                        title={item.security.detail ?? ''}
                      >
                        <ShieldIcon className="size-3" />
                        {item.security.verdict === 'infectado' ? 'ClamAV: ameaça' : 'ClamAV: limpo'}
                      </span>
                    )}
                    {missingExe ? (
                      <span className="glass-chip !border-amber-400/40 !text-amber-500 dark:!text-amber-300">
                        Executável ausente
                      </span>
                    ) : (
                      <span className="glass-chip max-w-[150px] truncate" title={item.exePath ?? ''}>
                        {item.exePath?.split(/[\\/]/).pop()}
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 flex items-center gap-1.5 truncate rounded-lg bg-black/10 px-2 py-1.5 font-mono text-[10px] text-muted dark:bg-black/20" title={item.installDir}>
                    <FolderIcon className="size-3 shrink-0 opacity-70" />
                    <span className="truncate">{shortPath(item.installDir, 46)}</span>
                  </p>
                  {missingExe && (
                    <p className="mt-1.5 text-[10px] leading-snug text-amber-600 dark:text-amber-400">
                      Use o menu e “Buscar automaticamente” para apontar o executável.
                    </p>
                  )}
                  {live && <p className="mt-1.5 text-[10.5px] font-medium text-accent-ink">{live}</p>}

                  <button
                    type="button"
                    onClick={() => openApp(item)}
                    disabled={running || missingExe}
                    className="glass-btn glass-btn-accent mt-3.5 w-full px-3 py-2 text-[12px] font-semibold"
                  >
                    <PlayIcon className="size-3.5" /> {running ? 'Abrindo…' : 'Abrir'}
                  </button>

                  {detected?.slug === item.slug && (
                    <div className="mt-3 rounded-lg border border-line bg-surface/80 p-2.5 backdrop-blur">
                      <p className="text-[11px] font-semibold">Instalações encontradas neste PC</p>
                      <div className="mt-2 space-y-1.5">
                        {detected.results.map((candidate, index) => (
                          <div
                            key={`${candidate.displayName}-${index}`}
                            className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11.5px] font-medium">{candidate.displayName}</p>
                              <p className="truncate text-[10px] text-muted" title={candidate.installLocation ?? ''}>
                                {candidate.version ? `v${candidate.version} · ` : ''}
                                {candidate.installLocation ?? candidate.exePath ?? 'local desconhecido'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => applyCandidate(item, candidate)}
                              className="rounded-md border border-line-strong px-2.5 py-1 text-[10.5px] font-medium hover:border-accent hover:text-accent-ink"
                            >
                              Usar este
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetected(null)}
                        className="mt-2 text-[10.5px] text-muted hover:text-ink"
                      >
                        Fechar
                      </button>
                    </div>
                  )}

                  {versions?.slug === item.slug && (
                    <div className="mt-3 rounded-lg border border-line bg-surface/80 p-2.5 backdrop-blur">
                      <p className="text-[11px] font-semibold">Baixar outra versão</p>
                      {versions.downloads.length === 0 ? (
                        <p className="mt-1.5 text-[11px] text-muted">
                          Este app não tem outras versões publicadas na loja.
                        </p>
                      ) : (
                        <div className="mt-2 space-y-1.5">
                          {versions.downloads.map((download) => (
                            <div
                              key={download.id}
                              className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-2"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[11.5px] font-medium">
                                  {download.label ?? `${PLATFORMS[download.platform]?.label ?? download.platform}`}
                                </p>
                                <p className="truncate text-[10px] text-muted">
                                  v{download.version ?? item.version} · {formatLabel(download.format)} ·{' '}
                                  {archLabel(download.arch)} · {formatBytes(download.file_size)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => installVersion(item, download)}
                                disabled={running}
                                className="rounded-md border border-line-strong px-2.5 py-1 text-[10.5px] font-medium hover:border-accent hover:text-accent-ink disabled:opacity-40"
                              >
                                Instalar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setVersions(null)}
                        className="mt-2 text-[10.5px] text-muted hover:text-ink"
                      >
                        Fechar
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted">
        {apps.length} {apps.length === 1 ? 'app instalado' : 'apps instalados'} · registros e pastas deste computador.
      </p>
    </section>
  )
}

// ------------------------------------------------- card menu (3 pontinhos)

function CardMenu({
  items,
  disabled,
}: {
  items: { label: string; icon?: ReactNode; onClick?: () => void; to?: string; danger?: boolean }[]
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const firstDanger = items.findIndex((item) => item.danger)

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Mais opções"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        className="glass-icon size-8 disabled:opacity-40"
      >
        <MoreIcon className="size-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="glass-menu absolute right-0 top-10 z-40 w-[212px]">
            {items.map((item, index) => {
              const content = (
                <>
                  {item.icon ?? <span className="size-3.5" />}
                  {item.label}
                </>
              )
              return (
                <div key={item.label}>
                  {index === firstDanger && firstDanger > 0 && <div className="glass-menu-sep" />}
                  {item.to ? (
                    <Link to={item.to} onClick={() => setOpen(false)} className="glass-menu-item">
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        item.onClick?.()
                      }}
                      className={`glass-menu-item ${item.danger ? 'glass-menu-item--danger' : ''}`}
                    >
                      {content}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ----------------------------------------------------------------- navegador

function DownloadedApps() {
  const [items, setItems] = useState<InstalledEntry[]>(() => readLibrary())

  function remove(slug: string) {
    const next = items.filter((i) => i.slug !== slug)
    setItems(next)
    localStorage.setItem('openstore.library', JSON.stringify(next))
  }

  function clearAll() {
    setItems([])
    localStorage.removeItem('openstore.library')
  }

  return (
    <section className="mt-7">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-[15px] font-semibold">Baixados neste navegador</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">Histórico local, sem conta e sem sincronização.</p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="glass-btn glass-btn-quiet px-3 py-1.5 text-[11.5px] font-medium"
          >
            Limpar histórico
          </button>
        )}
      </div>

      <div className="mt-3">
        <DesktopPromo />
      </div>

      {items.length === 0 ? (
        <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent-ink">
            <LibraryIcon className="size-7" />
          </span>
          <h3 className="mt-3 font-display text-[16px] font-semibold">Sua biblioteca está vazia</h3>
          <p className="mt-1 max-w-[380px] text-[12px] leading-relaxed text-muted">
            Quando você baixar um app, ele aparece aqui para voltar a baixar ou abrir a página rapidinho.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link to="/home" className="glass-btn glass-btn-accent px-4 py-2 text-[12.5px] font-semibold">
              Descobrir apps
            </Link>
            <Link
              to="/apps"
              className="glass-btn glass-btn-quiet px-4 py-2 text-[12.5px] font-medium"
            >
              Explorar catálogo
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3 overflow-hidden rounded-[var(--radius-card)] border border-line">
            {items.map((item, i) => (
              <div
                key={item.slug}
                className={`flex items-center gap-3 px-3 py-2.5 ${i % 2 ? 'bg-surface' : 'bg-surface-2'}`}
              >
                <div
                  className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-[10px] ring-1 ring-black/10"
                  style={{ background: item.accent ?? '#7c5cff' }}
                >
                  {item.logoUrl ? (
                    <img src={assetUrl(item.logoUrl)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <GhostMark className="size-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/app/${item.slug}`} className="block truncate text-[12.5px] font-medium text-ink hover:text-accent-ink">
                    {item.name}
                  </Link>
                  <p className="truncate text-[11px] text-muted">
                    {PLATFORMS[item.platform]?.label ?? formatLabel(item.platform)} · v{item.version} ·{' '}
                    {formatDate(item.date)}
                  </p>
                </div>
                <Link
                  to={`/app/${item.slug}`}
                  className="hidden items-center gap-1 rounded-md border border-line-strong px-2.5 py-1.5 text-[11px] font-medium text-ink transition hover:border-accent hover:text-accent-ink sm:flex"
                >
                  <DownloadIcon className="size-3.5" /> Baixar de novo
                </Link>
                <button
                  type="button"
                  aria-label={`Remover ${item.name}`}
                  onClick={() => remove(item.slug)}
                  className="rounded-md p-1.5 text-muted transition hover:bg-surface hover:text-red-500"
                >
                  <TrashIcon className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted">
            {items.length} {items.length === 1 ? 'item' : 'itens'} · registro local, sem conta e sem sincronização.
          </p>
        </>
      )}
    </section>
  )
}
