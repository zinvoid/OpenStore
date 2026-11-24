import { useCallback, useEffect, useState } from 'react'

export interface InstalledApp {
  slug: string
  name: string
  version: string
  platform: string
  format?: string | null
  kind?: string
  logoUrl?: string | null
  accent?: string | null
  installDir: string
  exePath: string | null
  uninstallString?: string | null
  sourceUrl?: string
  fileName?: string
  installedAt: string
  updatedAt: string
  security?: {
    verdict: string
    engine?: string
    at?: string
    detail?: string
  }
}

export interface DetectedInstall {
  displayName: string
  version?: string | null
  installLocation?: string | null
  uninstallString?: string | null
  exePath?: string | null
  source?: string
  score?: number
}

export interface InstallPayload {
  slug: string
  name: string
  version?: string
  url: string
  platform?: string
  format?: string | null
  logoUrl?: string | null
  accent?: string | null
}

export interface ProgressEvent {
  slug: string
  phase: 'download' | 'scan' | 'extract' | 'installer' | 'detect' | 'done'
  received: number
  total: number
  verdict?: string
  engine?: string
}

export interface ScanResult {
  ok: boolean
  available: boolean
  verdict: 'limpo' | 'infectado' | 'indisponivel' | 'erro'
  engine: string
  output?: string
  entry?: InstalledApp
}

export interface ClamavInfo {
  available: boolean
  version: string | null
  path: string | null
}

export interface UpdateProgress {
  phase: 'download' | 'launch'
  received: number
  total: number
}

export interface ActionResult {
  ok: boolean
  error?: string
  entry?: InstalledApp
}

interface DesktopBridge {
  isDesktop: boolean
  platform: string
  version: () => Promise<string>
  list: () => Promise<InstalledApp[]>
  install: (payload: InstallPayload) => Promise<ActionResult>
  launch: (slug: string) => Promise<ActionResult>
  reveal: (slug: string) => Promise<ActionResult>
  uninstall: (slug: string) => Promise<ActionResult>
  chooseFolder: (slug: string) => Promise<string | null>
  move: (slug: string, target: string) => Promise<ActionResult>
  detect: (payload: { slug: string; name?: string }) => Promise<{ ok: boolean; results: DetectedInstall[]; error?: string }>
  apply: (payload: { slug: string; candidate: DetectedInstall }) => Promise<ActionResult>
  security: () => Promise<{ clamav: ClamavInfo }>
  scan: (slug: string) => Promise<ScanResult>
  update: (payload: { url: string }) => Promise<{ ok: boolean; error?: string }>
  windowControl: (action: 'minimize' | 'maximize' | 'close') => Promise<{ ok: boolean }>
  openExternal: (url: string) => Promise<{ ok: boolean }>
  onProgress: (callback: (event: ProgressEvent) => void) => () => void
  onUpdateProgress: (callback: (event: UpdateProgress) => void) => () => void
}

/** Ponte exposta pelo preload do Electron. `null` quando roda no navegador. */
export const desktop: DesktopBridge | null =
  typeof window !== 'undefined' ? ((window as unknown as { openstore?: DesktopBridge }).openstore ?? null) : null

export const isDesktop = Boolean(desktop?.isDesktop)

export function useInstalledApps() {
  const [apps, setApps] = useState<InstalledApp[]>([])
  const [loading, setLoading] = useState(isDesktop)

  const refresh = useCallback(async () => {
    if (!desktop) {
      setLoading(false)
      return
    }
    try {
      const list = await desktop.list()
      setApps(Array.isArray(list) ? list : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { apps, refresh, loading }
}

export function shortPath(value?: string | null, max = 44): string {
  if (!value) return '—'
  if (value.length <= max) return value
  return `…${value.slice(value.length - max + 1)}`
}

export { shortPath as shortenPath }

export function phaseLabel(event: ProgressEvent | null): string | null {
  if (!event) return null
  switch (event.phase) {
    case 'download': {
      const percent = event.total ? Math.round((event.received / event.total) * 100) : null
      return percent === null ? 'Baixando…' : `Baixando ${percent}%`
    }
    case 'scan':
      return 'Analisando com ClamAV…'
    case 'extract':
      return 'Extraindo arquivos…'
    case 'installer':
      return 'Abrindo o instalador…'
    case 'detect':
      return 'Procurando o app instalado…'
    case 'done':
      return 'Concluído'
    default:
      return null
  }
}
