export interface Download {
  id: string
  app_id: string
  platform: string
  arch: string | null
  format: string | null
  label: string | null
  url: string
  file_size: number | null
  version: string | null
  min_os: string | null
  sha256?: string | null
  scan_status?: string | null
  scan_engine?: string | null
  scan_at?: string | null
  created_at?: string
}

export interface Review {
  id: string
  app_id: string
  author: string
  rating: number
  body: string | null
  created_at: string
}

export interface App {
  id: string
  slug: string
  name: string
  publisher: string
  tagline: string | null
  description: string | null
  category: string
  version: string | null
  price_cents: number
  currency: string
  website: string | null
  support_url: string | null
  logo_url: string | null
  cover_url: string | null
  accent: string | null
  platforms: string[]
  tags: string[]
  screenshots: string[]
  languages: string[]
  age_rating: string | null
  whats_new: string | null
  rating: number
  rating_count: number
  downloads_count: number
  featured: boolean
  verified: boolean
  owner_id?: string | null
  created_at: string
  app_downloads?: Download[]
}

export type AppWithDownloads = App & { app_downloads: Download[] }

export const CATEGORIES = [
  { key: 'Engenharia Reversa', accent: '#8b5cf6' },
  { key: 'Desenvolvimento', accent: '#3b82f6' },
  { key: 'Segurança', accent: '#ec4899' },
  { key: 'Redes', accent: '#0ea5e9' },
  { key: 'Android', accent: '#22c55e' },
  { key: 'Firmware', accent: '#f59e0b' },
  { key: 'Utilitários', accent: '#64748b' },
  { key: 'Produtividade', accent: '#14b8a6' },
  { key: 'Mídia', accent: '#f97316' },
  { key: 'Outros', accent: '#78716c' },
] as const

export type CategoryKey = (typeof CATEGORIES)[number]['key']
