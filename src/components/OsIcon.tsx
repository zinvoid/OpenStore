interface Props {
  platform: string
  className?: string
}

export function OsIcon({ platform, className = 'size-4' }: Props) {
  switch (platform) {
    case 'windows':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Windows">
          <rect x="3" y="3" width="8.2" height="8.2" rx="0.6" />
          <rect x="12.8" y="3" width="8.2" height="8.2" rx="0.6" />
          <rect x="3" y="12.8" width="8.2" height="8.2" rx="0.6" />
          <rect x="12.8" y="12.8" width="8.2" height="8.2" rx="0.6" />
        </svg>
      )
    case 'macos':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-label="macOS">
          <rect x="3" y="4.5" width="18" height="12" rx="2" />
          <path d="M2 19.5h20" strokeLinecap="round" />
        </svg>
      )
    case 'linux':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-label="Linux">
          <rect x="3" y="4.5" width="18" height="15" rx="2" />
          <path d="m7 9.5 2.8 2.6L7 14.7M12.5 15h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'android':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-label="Android">
          <path d="M6 10.5a6 6 0 0 1 12 0v6a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 16.5v-6Z" />
          <path d="m7.6 5 1.6 2.2M16.4 5l-1.6 2.2" strokeLinecap="round" />
          <circle cx="9.6" cy="11.4" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="14.4" cy="11.4" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'ios':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-label="iOS">
          <rect x="7" y="2.5" width="10" height="19" rx="2.4" />
          <path d="M10.5 5h3" strokeLinecap="round" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-label="Web">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.7 12h16.6M12 3.5c2.4 2.4 3.6 5.3 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.3-3.6-8.5S9.6 5.9 12 3.5Z" />
        </svg>
      )
  }
}
