import { assetUrl } from '../lib/format'

interface Props {
  className?: string
  glow?: boolean
}

/** Marca da OpenStore: o ícone de vidro oficial (public/icon.png). */
export function GhostMark({ className = 'size-9', glow = false }: Props) {
  return (
    <img
      src={assetUrl('icon.png')}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      className={`${className} shrink-0 object-contain ${
        glow ? 'drop-shadow-[0_10px_26px_rgba(107,87,245,0.35)]' : ''
      }`}
    />
  )
}

/** A marca dentro de uma placa de vidro — usada no rail, no login e na vitrine. */
export function GhostBadge({ size = 56, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[26%] border border-white/30 bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_18px_38px_-22px_rgba(72,52,180,0.6)] backdrop-blur-xl dark:border-white/12 dark:bg-white/[0.06] ${className}`}
      style={{ width: size, height: size }}
    >
      <GhostMark className="size-[74%]" glow />
    </span>
  )
}

export function GhostWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <GhostMark className="size-9" />
      <span className="font-display text-[16px] font-semibold tracking-[-0.02em]">OpenStore</span>
    </span>
  )
}
