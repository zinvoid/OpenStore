import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listApps } from '../lib/api'
import type { AppWithDownloads } from '../lib/types'
import { CATEGORIES } from '../lib/types'
import { Hero } from '../components/Hero'
import { Rail } from '../components/Rail'
import { AppCard } from '../components/AppCard'
import { AppTile } from '../components/AppTile'
import { ChevronRightIcon, UploadIcon } from '../components/Icons'
import { DesktopPromo } from '../components/DesktopPromo'
import { GhostBadge } from '../components/GhostLogo'
import { assetUrl, formatCount, formatPrice } from '../lib/format'
import { Stars } from '../components/Stars'

export default function Home() {
  const [apps, setApps] = useState<AppWithDownloads[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    listApps({ limit: 48 })
      .then((data) => alive && setApps(data))
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [])

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-lg font-semibold">Não foi possível carregar a loja</h1>
        <p className="mt-2 text-[13px] text-muted">{error}</p>
      </div>
    )
  }

  if (!apps) return <HomeSkeleton />

  if (apps.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-5 sm:px-6 lg:px-8">
        <section className="glass-panel relative overflow-hidden px-6 py-16 text-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background: 'radial-gradient(70% 120% at 50% 0%, color-mix(in srgb, var(--color-accent) 22%, transparent) 0%, transparent 68%)',
            }}
          />
          <div className="relative mx-auto flex max-w-[480px] flex-col items-center">
            <GhostBadge size={92} />
            <h1 className="title-soft mt-6 font-display text-[26px] font-semibold sm:text-[30px]">
              A vitrine está começando
            </h1>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
              Só aparecem aqui os apps que a comunidade publicar. Nenhum app de exemplo, nenhuma cópia — publique o
              seu e ele entra na loja na hora.
            </p>
            <Link
              to="/publish"
              className="glass-btn glass-btn-accent mt-7 inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold"
            >
              <UploadIcon className="size-4" /> Publicar o primeiro app
            </Link>
          </div>
        </section>
        <DesktopPromo />
      </div>
    )
  }

  const featured = apps.filter((a) => a.featured)
  const free = [...apps].sort((a, b) => b.downloads_count - a.downloads_count).slice(0, 10)
  const recent = [...apps].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 3)
  const reTools = apps.filter((a) => a.category === 'Engenharia Reversa' || a.category === 'Segurança')

  return (
      <div className="relative mx-auto w-full max-w-[1500px] space-y-10 px-4 py-5 sm:px-6 lg:px-8">
      <Hero apps={featured.length ? featured : apps} />

      <Rail title="Essenciais para começar" subtitle="Ferramentas que a comunidade instala primeiro" seeAllTo="/apps">
        {apps.slice(0, 12).map((app) => (
          <div key={app.id} className="shrink-0">
            <AppCard app={app} width={210} />
          </div>
        ))}
      </Rail>

      <section>
        <div className="mb-3 flex items-end justify-between px-0.5">
          <div>
            <h2 className="font-display text-[17px] font-semibold tracking-[-0.01em]">Mais baixados</h2>
            <p className="mt-0.5 text-[12px] text-muted">Grátis e prontos para instalar</p>
          </div>
          <Link to="/apps?sort=downloads" className="text-[12px] font-medium text-accent-ink hover:underline">
            Ver tudo
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {free.slice(0, 10).map((app) => (
            <AppCard key={app.id} app={app} width={null} />
          ))}
        </div>
      </section>

      <Rail title="Novidades no OpenStore" subtitle="Publicados recentemente pela comunidade" seeAllTo="/apps?sort=recent">
        {recent.map((app) => (
          <RecentCard key={app.id} app={app} />
        ))}
      </Rail>

      <Rail title="Engenharia reversa e segurança" subtitle="Para entender o que qualquer programa faz por dentro" seeAllTo="/apps?cat=Engenharia+Reversa">
        {(reTools.length ? reTools : apps).slice(0, 10).map((app) => (
          <div key={app.id} className="shrink-0">
            <AppCard app={app} width={210} />
          </div>
        ))}
      </Rail>

      <section>
        <div className="mb-3 flex items-end justify-between px-0.5">
          <h2 className="font-display text-[17px] font-semibold tracking-[-0.01em]">Navegue por categoria</h2>
          <Link to="/apps" className="text-[12px] font-medium text-accent-ink hover:underline">
            Todos os apps
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.slice(0, 10).map((cat) => (
            <Link
              key={cat.key}
              to={`/apps?cat=${encodeURIComponent(cat.key)}`}
              className="glass-card group relative overflow-hidden p-4"
            >
              <span
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ background: `linear-gradient(90deg, ${cat.accent}, ${cat.accent}00)` }}
              />
              <p className="text-[13px] font-semibold text-ink">{cat.key}</p>
              <p className="mt-1 text-[11px] text-muted">
                {apps.filter((a) => a.category === cat.key).length} apps
              </p>
              <ChevronRightIcon className="mt-3 size-3.5 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent-ink" />
            </Link>
          ))}
        </div>
      </section>

      <DesktopPromo />

      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div className="max-w-[560px]">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-accent-ink">
              Para desenvolvedores
            </p>
            <h2 className="mt-2 font-display text-[20px] font-semibold sm:text-[23px]">
              Publique seu app e apareça para todo mundo
            </h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              Suba executáveis para Windows, Linux, macOS e Android. O OpenStore detecta o sistema de quem visita
              e entrega o download certo automaticamente.
            </p>
          </div>
          <Link
            to="/publish"
            className="glass-btn glass-btn-accent px-4 py-2.5 text-[13px] font-semibold"
          >
            <UploadIcon className="size-4" />
            Publicar meu app
          </Link>
        </div>
      </section>
    </div>
  )
}

function RecentCard({ app }: { app: AppWithDownloads }) {
  const cover = assetUrl(app.cover_url)
  return (
    <Link
      to={`/app/${app.slug}`}
      className="glass-card w-[290px] shrink-0 snap-start overflow-hidden sm:w-[330px]"
    >
      <div className="relative h-[112px] w-full overflow-hidden" style={{ background: app.accent ?? '#7c5cff' }}>
        {cover ? (
          <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-white/20 to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2.5 left-3">
          <AppTile app={app} size={34} radius={8} />
        </div>
      </div>
      <div className="p-3">
        <p className="truncate text-[13px] font-semibold">{app.name}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted">{app.tagline ?? app.publisher}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Stars value={Number(app.rating)} />
            <span className="text-[10.5px] text-muted">{formatCount(app.downloads_count)} downloads</span>
          </span>
          <span className="text-[11px] font-medium text-emerald-500">
            {formatPrice(app.price_cents, app.currency)}
          </span>
        </div>
      </div>
    </Link>
  )
}

function HomeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 px-4 py-5 sm:px-6 lg:px-8">
      <div className="skeleton h-[300px] rounded-[14px]" />
      <div className="space-y-3">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-[132px] w-[210px] shrink-0 rounded-[var(--radius-card)]" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton h-[96px] rounded-[var(--radius-card)]" />
          ))}
        </div>
      </div>
    </div>
  )
}
