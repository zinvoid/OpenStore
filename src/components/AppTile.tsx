import type { App } from '../lib/types'
import { accentFromString, assetUrl } from '../lib/format'

interface Props {
  app: Pick<App, 'name' | 'logo_url' | 'accent'>
  size?: number
  radius?: number
  className?: string
  glow?: boolean
}

export function AppTile({ app, size = 56, radius = 14, className = '', glow = false }: Props) {
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
        background: logo
          ? `linear-gradient(140deg, ${accent}44, ${accent}11)`
          : `linear-gradient(140deg, ${accent}, ${accent}99)`,
        boxShadow: glow ? `0 10px 30px -12px ${accent}` : undefined,
      }}
    >
      {logo ? (
        <img src={logo} alt={app.name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-display font-semibold text-white"
          style={{ fontSize: size * 0.36, letterSpacing: '-0.02em' }}
        >
          {initials || '?'}
        </span>
      )}
      <span
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10"
      />
    </div>
  )
}
