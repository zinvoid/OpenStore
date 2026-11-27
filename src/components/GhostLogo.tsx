import type { CSSProperties } from 'react'
import { assetUrl } from '../lib/format'

interface Props {
  className?: string
  glow?: boolean
  style?: CSSProperties
}

/** Marca da OpenStore: a sacola com o fantasma (public/icon.png). */
export function GhostMark({ className = 'size-9', glow = false, style }: Props) {
  return (
    <img
      src={assetUrl('icon.png')}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      style={style}
      className={`${className} shrink-0 object-contain ${
        glow ? 'drop-shadow-[0_8px_18px_rgba(16,16,16,0.18)]' : ''
      }`}
    />
  )
}

/** A marca dentro de uma placa — usada no login, na vitrine e nas promoções. */
export function GhostBadge({ size = 56, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`relative shrink-0 overflow-hidden rounded-[22%] border border-line bg-surface ${className}`}
      style={{ width: size, height: size }}
    >
      <GhostMark className="absolute inset-[7%] size-auto" />
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
