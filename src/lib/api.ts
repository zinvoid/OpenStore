import { supabase, ASSET_BUCKET, FILE_BUCKET, publicUrl } from './supabase'
import type { AppWithDownloads, Download, Review } from './types'
import { extensionOf, platformFromExtension } from './platform'
import { slugify } from './format'
import { readSession } from './auth'

const APP_SELECT = '*, app_downloads(*)'

export interface ListOptions {
  query?: string
  category?: string
  platform?: string
  sort?: 'relevance' | 'recent' | 'rating' | 'downloads'
  featured?: boolean
  limit?: number
  excludeSlug?: string
}

export async function listApps(opts: ListOptions = {}): Promise<AppWithDownloads[]> {
  let request = supabase.from('apps').select(APP_SELECT)

  if (opts.query?.trim()) {
    const q = opts.query.trim().replace(/[%,]/g, ' ')
    request = request.or(`name.ilike.%${q}%,publisher.ilike.%${q}%,tagline.ilike.%${q}%,category.ilike.%${q}%`)
  }
  if (opts.category) request = request.eq('category', opts.category)
  if (opts.featured) request = request.eq('featured', true)
  if (opts.platform) request = request.contains('platforms', [opts.platform])
  if (opts.excludeSlug) request = request.neq('slug', opts.excludeSlug)

  switch (opts.sort) {
    case 'recent':
      request = request.order('created_at', { ascending: false })
      break
    case 'rating':
      request = request.order('rating', { ascending: false })
      break
    case 'downloads':
      request = request.order('downloads_count', { ascending: false })
      break
    default:
      request = request.order('featured', { ascending: false }).order('downloads_count', { ascending: false })
  }

  request = request.order('name', { ascending: true }).limit(opts.limit ?? 60)

  const { data, error } = await request
  if (error) throw error
  return (data ?? []) as AppWithDownloads[]
}

export async function getApp(slug: string): Promise<AppWithDownloads | null> {
  const { data, error } = await supabase.from('apps').select(APP_SELECT).eq('slug', slug).maybeSingle()
  if (error) throw error
  return (data as AppWithDownloads) ?? null
}

export async function getReviews(appId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('app_id', appId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return (data ?? []) as Review[]
}

export async function addReview(appId: string, author: string, rating: number, body: string) {
  const { error } = await supabase.from('reviews').insert({ app_id: appId, author, rating, body })
  if (error) throw error
  const { data } = await supabase.from('reviews').select('rating').eq('app_id', appId)
  const list = (data ?? []) as { rating: number }[]
  const avg = list.reduce((sum, r) => sum + r.rating, 0) / (list.length || 1)
  await supabase
    .from('apps')
    .update({ rating: Number(avg.toFixed(1)), rating_count: list.length })
    .eq('id', appId)
}

export async function trackDownload(slug: string) {
  const { error } = await supabase.rpc('increment_downloads', { app_slug: slug })
  if (error) console.warn('[OpenStore] não foi possível contar o download:', error.message)
}

// ------------------------------------------------------------------ uploads

function safeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .slice(-80)
}

export async function uploadAsset(file: File, slug: string, kind: string): Promise<string> {
  const path = `${slug}/${kind}-${Date.now()}-${safeName(file.name)}`
  const { error } = await supabase.storage.from(ASSET_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type || undefined,
    upsert: false,
  })
  if (error) throw new Error(`Falha ao enviar ${file.name}: ${error.message}`)
  return publicUrl(ASSET_BUCKET, path)
}

export async function uploadBinary(file: File, slug: string): Promise<string> {
  const path = `${slug}/${Date.now()}-${safeName(file.name)}`
  const { error } = await supabase.storage.from(FILE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw new Error(`Falha ao enviar ${file.name}: ${error.message}`)
  return publicUrl(FILE_BUCKET, path)
}

// ------------------------------------------------------------- publicação

export interface DownloadInput {
  id?: string
  platform: string
  arch: string
  format: string
  label: string
  url: string
  fileSize: number
  minOs: string
  sha256?: string | null
  scanStatus?: string | null
  scanEngine?: string | null
  scanAt?: string | null
}

export interface PublishInput {
  name: string
  publisher: string
  tagline: string
  description: string
  category: string
  version: string
  priceCents: number
  website: string
  supportUrl: string
  accent: string
  logoUrl: string
  coverUrl: string
  screenshots: string[]
  tags: string[]
  languages: string[]
  ageRating: string
  whatsNew: string
  downloads: DownloadInput[]
}

const SAVE_ERRORS: Record<string, string> = {
  session_invalid: 'Sua sessão expirou. Saia e entre novamente para publicar.',
  not_owner: 'Só quem publicou este app pode editá-lo.',
  app_missing: 'Este app não existe mais.',
}

function saveError(message: string): string {
  const key = Object.keys(SAVE_ERRORS).find((name) => message.includes(name))
  return key ? SAVE_ERRORS[key] : message
}

/** Formato único aceito pela função openstore_save_app no banco. */
function appPayload(input: PublishInput) {
  const version = input.version.trim() || '1.0.0'
  return {
    name: input.name.trim(),
    publisher: input.publisher.trim(),
    tagline: input.tagline.trim(),
    description: input.description.trim(),
    category: input.category,
    version,
    price_cents: input.priceCents,
    website: input.website.trim(),
    support_url: input.supportUrl.trim(),
    logo_url: input.logoUrl || null,
    cover_url: input.coverUrl || null,
    accent: input.accent || '#7c5cff',
    tags: input.tags,
    screenshots: input.screenshots,
    languages: input.languages,
    age_rating: input.ageRating,
    whats_new: input.whatsNew.trim(),
    downloads: input.downloads
      .filter((d) => d.url.trim())
      .map((d) => ({
        platform: d.platform || platformFromExtension(extensionOf(d.url)) || 'windows',
        arch: d.arch || 'universal',
        format: d.format || extensionOf(d.url),
        label: d.label || null,
        url: d.url.trim(),
        file_size: d.fileSize || 0,
        version,
        min_os: d.minOs || null,
        sha256: d.sha256 ?? null,
        scan_status: d.scanStatus ?? 'pendente',
        scan_engine: d.scanEngine ?? null,
        scan_at: d.scanAt ?? null,
      })),
  }
}

/** Cria o anúncio e seus downloads, sempre pela função autenticada do banco. */
export async function publishApp(input: PublishInput): Promise<string> {
  const account = readSession()
  if (!account) throw new Error('Entre na sua conta para publicar um app.')
  if (!account.token) throw new Error('Sua sessão é antiga. Saia e entre novamente para publicar.')

  const { data, error } = await supabase.rpc('openstore_save_app', {
    p_token: account.token,
    p_slug: null,
    p_payload: { ...appPayload(input), slug_base: slugify(input.name) || 'app' },
  })
  if (error) throw new Error(saveError(error.message))
  return (data as { slug: string }).slug
}

/** Atualiza um app e seus downloads. O banco confere se a conta é a dona. */
export async function updateApp(slug: string, input: PublishInput): Promise<string> {
  const account = readSession()
  if (!account) throw new Error('Entre na sua conta para editar este app.')
  if (!account.token) throw new Error('Sua sessão é antiga. Saia e entre novamente para editar.')

  const { data, error } = await supabase.rpc('openstore_save_app', {
    p_token: account.token,
    p_slug: slug,
    p_payload: appPayload(input),
  })
  if (error) throw new Error(saveError(error.message))
  return (data as { slug: string }).slug
}

/** Apaga um app do próprio autor. O banco confere a sessão e a posse antes de remover. */
export async function deleteApp(slug: string): Promise<void> {
  const account = readSession()
  if (!account) throw new Error('Entre na sua conta para excluir este app.')
  if (!account.token) throw new Error('Sua sessão é antiga. Saia e entre novamente para excluir.')

  const { error } = await supabase.rpc('openstore_delete_app', { p_token: account.token, p_slug: slug })
  if (error) throw new Error(saveError(error.message))
}

/** Apps publicados pela conta atual, para a área “Meus apps”. */
export async function listMyApps(ownerId: string): Promise<AppWithDownloads[]> {
  const { data, error } = await supabase
    .from('apps')
    .select(APP_SELECT)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as AppWithDownloads[]
}

export function bestDownload(app: AppWithDownloads, os: string): Download | null {
  const downloads = app.app_downloads ?? []
  if (!downloads.length) return null
  const forOs = downloads.filter((d) => d.platform === os)
  if (!forOs.length) return null
  const arch = /arm/i.test(navigator?.userAgent ?? '') ? 'arm64' : 'x64'
  return (
    forOs.find((d) => d.arch === arch) ??
    forOs.find((d) => d.arch === 'universal') ??
    forOs[0]
  )
}

// ------------------------------------------------------------- biblioteca

export interface InstalledEntry {
  slug: string
  name: string
  version: string
  platform: string
  date: string
  logoUrl?: string | null
  accent?: string | null
}

export function readLibrary(): InstalledEntry[] {
  try {
    const raw = localStorage.getItem('openstore.library')
    return raw ? (JSON.parse(raw) as InstalledEntry[]) : []
  } catch {
    return []
  }
}

export function addToLibrary(entry: InstalledEntry) {
  const list = readLibrary().filter((e) => e.slug !== entry.slug)
  list.unshift(entry)
  localStorage.setItem('openstore.library', JSON.stringify(list.slice(0, 50)))
}
