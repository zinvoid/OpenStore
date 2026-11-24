import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listApps } from '../lib/api'
import type { AppWithDownloads } from '../lib/types'
import { CATEGORIES } from '../lib/types'
import { AppCard } from '../components/AppCard'
import { OsIcon } from '../components/OsIcon'
import { SearchIcon, GridIcon } from '../components/Icons'

const PLATFORM_FILTERS = [
  { key: '', label: 'Todas as plataformas' },
  { key: 'windows', label: 'Windows' },
  { key: 'macos', label: 'macOS' },
  { key: 'linux', label: 'Linux' },
  { key: 'android', label: 'Android' },
]

const SORTS = [
  { key: 'relevance', label: 'Relevância' },
  { key: 'downloads', label: 'Mais baixados' },
  { key: 'rating', label: 'Melhor avaliados' },
  { key: 'recent', label: 'Mais recentes' },
]

export default function Browse() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const category = params.get('cat') ?? ''
  const platform = params.get('platform') ?? ''
  const sort = (params.get('sort') ?? 'relevance') as 'relevance' | 'downloads' | 'rating' | 'recent'

  const [apps, setApps] = useState<AppWithDownloads[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  useEffect(() => {
    let alive = true
    setApps(null)
    listApps({ query, category: category || undefined, platform: platform || undefined, sort, limit: 60 })
      .then((data) => alive && setApps(data))
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [query, category, platform, sort])

  const title = useMemo(() => {
    if (query) return `Resultados para “${query}”`
    if (category) return category
    if (sort === 'recent') return 'Novidades'
    if (sort === 'downloads') return 'Mais baixados'
    return 'Todos os apps'
  }, [query, category, sort])

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] sm:text-[26px]">{title}</h1>
          <p className="mt-1 text-[12.5px] text-muted">
            {apps ? `${apps.length} ${apps.length === 1 ? 'app encontrado' : 'apps encontrados'}` : 'Carregando catálogo...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="platform-filter">
            Plataforma
          </label>
          <select
            id="platform-filter"
            value={platform}
            onChange={(e) => update('platform', e.target.value)}
            className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-[12px] text-ink outline-none focus:border-accent"
          >
            {PLATFORM_FILTERS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="sort-filter">
            Ordenar por
          </label>
          <select
            id="sort-filter"
            value={sort}
            onChange={(e) => update('sort', e.target.value)}
            className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-[12px] text-ink outline-none focus:border-accent"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => update('cat', '')}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
            !category
              ? 'border-accent bg-accent-soft text-accent-ink'
              : 'border-line bg-surface text-muted hover:text-ink'
          }`}
        >
          Tudo
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => update('cat', cat.key)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
              category === cat.key
                ? 'border-accent bg-accent-soft text-accent-ink'
                : 'border-line bg-surface text-muted hover:text-ink'
            }`}
          >
            {cat.key}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {error && (
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6 text-[13px] text-muted">
            Não foi possível carregar o catálogo: {error}
          </div>
        )}

        {!apps && !error && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton h-[96px] rounded-[var(--radius-card)]" />
            ))}
          </div>
        )}

        {apps && apps.length === 0 && (
          <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface/50 px-6 py-16 text-center">
            <SearchIcon className="size-7 text-muted" />
            <p className="mt-3 text-[14px] font-semibold">Nada encontrado</p>
            <p className="mt-1 max-w-sm text-[12.5px] text-muted">
              Ajuste os filtros ou publique o primeiro app com esse nome.
            </p>
            <Link
              to="/publish"
              className="glass-btn glass-btn-accent mt-4 px-4 py-2 text-[12.5px] font-semibold"
            >
              Publicar app
            </Link>
          </div>
        )}

        {apps && apps.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} width={null} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-[12px] text-muted">
        <GridIcon className="size-4 text-accent-ink" />
        Cada app mostra apenas os downloads compatíveis com o seu sistema, mas você pode abrir as outras versões
        na página do produto.
        <span className="ml-auto flex items-center gap-2">
          {['windows', 'macos', 'linux', 'android'].map((p) => (
            <OsIcon key={p} platform={p} className="size-3.5" />
          ))}
        </span>
      </div>
    </div>
  )
}
