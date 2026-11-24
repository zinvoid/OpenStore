import { supabase } from './supabase'
import { desktop } from './desktop'

declare const __APP_VERSION__: string

export const BUILD_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0'

export interface Release {
  version: string
  notes: string | null
  url: string | null
  published_at: string
}

export function compareVersions(a: string, b: string): number {
  const parse = (value: string) =>
    value
      .replace(/^v/i, '')
      .split(/[.-]/)
      .map((part) => Number.parseInt(part, 10) || 0)
  const left = parse(a)
  const right = parse(b)
  const length = Math.max(left.length, right.length)
  for (let i = 0; i < length; i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0)
    if (diff !== 0) return diff > 0 ? 1 : -1
  }
  return 0
}

/** Versão em execução: o Electron manda a versão do pacote, o navegador usa a do build. */
export async function currentVersion(): Promise<string> {
  try {
    const version = await desktop?.version()
    if (version) return version
  } catch {
    /* segue com a versão do build */
  }
  return BUILD_VERSION
}

export async function fetchReleases(): Promise<Release[]> {
  const { data, error } = await supabase
    .from('openstore_releases')
    .select('version, notes, url, published_at')
    .order('published_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return (data ?? []) as Release[]
}

export async function latestRelease(): Promise<Release | null> {
  const releases = await fetchReleases()
  if (!releases.length) return null
  return releases.reduce((best, release) => (compareVersions(release.version, best.version) > 0 ? release : best))
}

/** Retorna a release mais nova, se for mais recente que a versão em execução. */
export async function findUpdate(): Promise<{ release: Release; current: string } | null> {
  const current = await currentVersion()
  const releases = await fetchReleases()
  if (!releases.length) return null
  const newest = releases.reduce((best, release) => (compareVersions(release.version, best.version) > 0 ? release : best))
  if (compareVersions(newest.version, current) <= 0) return null
  return { release: newest, current }
}

export function openRelease(release: Release | null) {
  if (!release?.url) return false
  if (desktop) void desktop.openExternal(release.url)
  else window.open(release.url, '_blank', 'noopener,noreferrer')
  return true
}
