import type { App } from '../lib/types'
import { accentFromString, assetUrl } from '../lib/format'

interface Props {
  app: Pick<App, 'name' | 'logo_url' | 'accent'>
  size?: number
  radius?: number
  className?: string
  glow?: boolean
}

export function AppTile({ app, size = 60, radius = 16, className = '', glow = false }: Props) {
  const accent = app.accent || accentFromString(app.name)
  const logo = assetUrl(app.logo_url)
  const initials = app.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: logo ? `${accent}14` : accent,
        boxShadow: glow ? `0 10px 24px -16px ${accent}` : `inset 0 0 0 1px rgba(0,0,0,0.08)`,
      }}
    >
      {logo ? (
        <img src={logo} alt={app.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-display font-semibold text-white"
          style={{ fontSize: size * 0.36, letterSpacing: '-0.03em' }}
        >
          {initials || '?'}
        </span>
      )}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/10 dark:ring-white/10" />
    </div>
  )
}
