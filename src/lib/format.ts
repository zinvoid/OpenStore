/** Formatação de preço, tamanho, datas e notas. */

export function formatPrice(cents: number, currency = 'BRL'): string {
  if (!cents) return 'Grátis'
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(cents / 100)
  } catch {
    return `R$ ${(cents / 100).toFixed(2)}`
  }
}

export function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  const digits = value >= 100 || unit === 0 ? 0 : 1
  return `${value.toFixed(digits)} ${units[unit]}`
}

export function formatCount(n?: number | null): string {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} mi`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')} mil`
  return String(n)
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function ratingLabel(rating: number): string {
  if (!rating) return 'Sem avaliações'
  if (rating >= 4.5) return 'Excelente'
  if (rating >= 4) return 'Muito bom'
  if (rating >= 3) return 'Bom'
  if (rating >= 2) return 'Regular'
  return 'Ruim'
}

/** Cor de destaque derivada do nome (fallback de logo). */
export function accentFromString(value: string): string {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }
  const palette = ['#7c5cff', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f97316']
  return palette[Math.abs(hash) % palette.length]
}

/** Resolve caminhos locais (public/) tanto na web quanto no Electron (file://). */
export function assetUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  const base = import.meta.env.BASE_URL || './'
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}
