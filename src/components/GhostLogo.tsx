import { assetUrl } from '../lib/format'

interface Props {
  className?: string
  glow?: boolean
}

/** Marca da OpenStore: o ícone de vidro oficial (public/icon.png). */
export function GhostMark({ className = 'size-8', glow = false }: Props) {
  return (
    <img
      src={assetUrl('icon.png')}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`${className} shrink-0 object-contain ${
        glow ? 'drop-shadow-[0_8px_20px_rgba(124,92,255,0.38)]' : ''
      }`}
    />
  )
}

export function GhostWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <GhostMark className="size-6" />
      <span className="font-display text-[15px] font-semibold tracking-tight">OpenStore</span>
    </span>
  )
}
