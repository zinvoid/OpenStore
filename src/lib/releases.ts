import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { desktop } from './desktop'
import { GITHUB_RELEASES, GITHUB_REPO } from './site'
import type { OSKey } from './platform'

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

/** Última versão publicada, para os botões de download do site. */
export function useLatestRelease(): Release | null {
  const [release, setRelease] = useState<Release | null>(null)

  useEffect(() => {
    let alive = true
    latestRelease()
      .then((value) => {
        if (alive) setRelease(value)
      })
      .catch(() => {
        /* sem releases publicadas ainda */
      })
    return () => {
      alive = false
    }
  }, [])

  return release
}

/** Retorna a release mais nova, se for mais recente que a versão em execução. */
export async function findUpdate(): Promise<{ release: Release; current: string } | null> {
  const current = await currentVersion()
  const releases = await fetchReleases().catch(() => [])
  const fromChannel = releases.length
    ? releases.reduce((best, release) => (compareVersions(release.version, best.version) > 0 ? release : best))
    : null

  // O GitHub é a fonte da verdade: se o canal do banco estiver atrasado, ele decide.
  const github = await fetchGithubRelease()
  const githubUpdate = github ? githubAssetRelease(github) : null
  const newest =
    githubUpdate && (!fromChannel || compareVersions(githubUpdate.version, fromChannel.version) > 0)
      ? githubUpdate
      : fromChannel

  if (!newest || compareVersions(newest.version, current) <= 0) return null
  return { release: newest, current }
}

function githubAssetRelease(github: GithubRelease): Release {
  const platform = desktop?.platform
  const patterns =
    platform === 'linux'
      ? [/x86_64\.AppImage$/i, /\.AppImage$/i]
      : platform === 'darwin'
        ? [/\.dmg$/i]
        : [/Setup[.\s_-].*\.exe$/i, /portable\.exe$/i]
  const asset = patterns.map((pattern) => github.assets.find((item) => pattern.test(item.name))).find(Boolean)
  return {
    version: github.version,
    notes: null,
    url: asset?.url ?? github.page,
    published_at: new Date().toISOString(),
  }
}

export function openRelease(release: Release | null) {
  if (!release?.url) return false
  if (desktop) void desktop.openExternal(release.url)
  else window.open(release.url, '_blank', 'noopener,noreferrer')
  return true
}

/** Última release publicada no GitHub, com os arquivos de cada sistema. */
export interface GithubRelease {
  version: string
  page: string
  assets: { name: string; url: string }[]
}

export async function fetchGithubRelease(): Promise<GithubRelease | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      tag_name?: string
      html_url?: string
      assets?: { name: string; browser_download_url: string }[]
    }
    if (!data.tag_name) return null
    return {
      version: data.tag_name.replace(/^v/i, ''),
      page: data.html_url ?? GITHUB_RELEASES,
      assets: (data.assets ?? []).map((asset) => ({ name: asset.name, url: asset.browser_download_url })),
    }
  } catch {
    return null
  }
}

export function useGithubRelease(): GithubRelease | null {
  const [release, setRelease] = useState<GithubRelease | null>(null)

  useEffect(() => {
    let alive = true
    fetchGithubRelease().then((value) => {
      if (alive && value) setRelease(value)
    })
    return () => {
      alive = false
    }
  }, [])

  return release
}

/** Para onde o botão de download do site leva, de acordo com o sistema do visitante. */
export interface DownloadTarget {
  label: string
  href: string
  detail: string
}

function assetFor(github: GithubRelease | null, patterns: RegExp[]): string | null {
  if (!github) return null
  for (const pattern of patterns) {
    const found = github.assets.find((asset) => pattern.test(asset.name))
    if (found) return found.url
  }
  return null
}

export function siteDownload(release: Release | null, os: OSKey, github: GithubRelease | null = null): DownloadTarget {
  const versionNumber = github?.version ?? release?.version
  const version = versionNumber ? `Versão ${versionNumber} · ` : ''

  if (os === 'linux') {
    const href =
      assetFor(github, [/x86_64\.AppImage$/i, /amd64\.deb$/i, /\.AppImage$/i, /\.deb$/i]) ??
      (github?.page ?? GITHUB_RELEASES)
    return { label: 'Baixar para Linux', href, detail: `${version}AppImage ou .deb no GitHub` }
  }
  if (os === 'macos') {
    return {
      label: 'Baixar para macOS',
      href: assetFor(github, [/\.dmg$/i]) ?? github?.page ?? GITHUB_RELEASES,
      detail: 'Build para macOS publicado no GitHub',
    }
  }
  if (os === 'android' || os === 'ios') {
    return {
      label: 'Ver versões no GitHub',
      href: github?.page ?? GITHUB_RELEASES,
      detail: 'Disponível para computador',
    }
  }
  return {
    label: 'Baixar para Windows',
    href:
      assetFor(github, [/Setup[.\s_-].*\.exe$/i, /portable\.exe$/i]) ??
      release?.url ??
      github?.page ??
      GITHUB_RELEASES,
    detail: `${version}Windows 10/11 · x64`,
  }
}
