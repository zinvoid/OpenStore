import { Link } from 'react-router-dom'
import type { App } from '../lib/types'
import { AppTile } from './AppTile'
import { Stars } from './Stars'
import { OsIcon } from './OsIcon'
import { formatPrice } from '../lib/format'

interface Props {
  app: App
  width?: number | null
}

export function AppCard({ app, width = 172 }: Props) {
  const firstDownload = app.app_downloads?.[0]
  return (
    <Link
      to={`/app/${app.slug}`}
      className="glass-card group flex flex-col gap-3 p-3.5"
      style={width ? { width } : undefined}
    >
      <div className="flex items-start gap-3">
        <AppTile app={app} size={62} radius={17} />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-[13.5px] font-semibold leading-tight tracking-[-0.01em] text-ink">{app.name}</p>
          <p className="mt-1 truncate text-[11px] text-muted">{app.publisher}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <Stars value={Number(app.rating)} />
            <span className="text-[10.5px] tabular-nums text-muted">
              {app.rating ? Number(app.rating).toFixed(1) : '—'}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className={`text-[11.5px] font-medium ${app.price_cents ? 'text-ink' : 'text-emerald-500 dark:text-emerald-400'}`}>
          {formatPrice(app.price_cents, app.currency)}
        </span>
        <span className="flex items-center gap-1.5 text-muted">
          {(app.platforms ?? []).slice(0, 3).map((p) => (
            <OsIcon key={p} platform={p} className="size-3" />
          ))}
          {!app.platforms?.length && firstDownload && <OsIcon platform={firstDownload.platform} className="size-3" />}
        </span>
      </div>
    </Link>
  )
}
