interface Props {
  className?: string
  glow?: boolean
}

export function GhostMark({ className = 'size-8', glow = false }: Props) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bag-body" x1="6" y1="12" x2="27" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f8f4ff" />
          <stop offset="0.45" stopColor="#cbb2ff" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="bag-handle" x1="11" y1="5" x2="22" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f4ecff" />
          <stop offset="1" stopColor="#9b7bff" />
        </linearGradient>
      </defs>
      {glow && <circle cx="16" cy="18" r="14" fill="#8b5cf6" opacity="0.24" />}
      <path
        d="M11.6 13.6v-2.2a4.4 4.4 0 0 1 8.8 0v2.2"
        fill="none"
        stroke="url(#bag-handle)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M7.4 12.6h17.2c1.7 0 3 1.3 3 3v9.9c0 2-1.6 3.6-3.6 3.6H8c-2 0-3.6-1.6-3.6-3.6v-9.9c0-1.7 1.3-3 3-3Z"
        fill="url(#bag-body)"
      />
      <path
        d="M7.4 13.1h6.5c-1.4 2.7-3.6 4.6-7.1 5.5a2.1 2.1 0 0 1-1.5-.6v-2.4a2.6 2.6 0 0 1 2.1-2.5Z"
        fill="#ffffff"
        opacity="0.45"
      />
      <path
        d="M16 15.8c-3.1 0-5.4 2.6-5.4 5.8v3.4c0 .65.75.98 1.24.57l1.16-.9a.83.83 0 0 1 1.02 0l1.1.85a1 1 0 0 0 1.2 0l1.1-.85a.83.83 0 0 1 1.02 0l1.16.9c.49.41 1.24.08 1.24-.57v-3.4c0-3.2-2.3-5.8-5.4-5.8Z"
        fill="#150a2e"
      />
      <path d="M12.6 18.9 15.2 18.05 14.7 20.4Z" fill="#f6f2ff" />
      <path d="M19.4 18.9 16.8 18.05 17.3 20.4Z" fill="#f6f2ff" />
    </svg>
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
