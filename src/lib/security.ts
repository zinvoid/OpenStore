/**
 * Verificação dos arquivos de app.
 *
 * Na loja web o que dá para checar de forma confiável é o formato, o tamanho e o
 * SHA-256 do arquivo. A análise antivírus roda no app do desktop, com o ClamAV
 * instalado na máquina — o resultado é mostrado no gerenciador antes de abrir o
 * instalador.
 */

/** Limite do plano atual do Storage (50 MB por objeto). */
export const MAX_BINARY_BYTES = 50 * 1024 * 1024

const ALLOWED = new Set([
  'exe',
  'msi',
  'msix',
  'appx',
  'zip',
  '7z',
  'rar',
  'tar',
  'gz',
  'tgz',
  'deb',
  'rpm',
  'appimage',
  'flatpak',
  'dmg',
  'pkg',
  'apk',
  'aab',
  'ipa',
  'jar',
  'whl',
  'bin',
])

export type ScanStatus = 'pendente' | 'aprovado' | 'suspeito' | 'bloqueado' | 'analise'

export const SCAN_META: Record<ScanStatus, { label: string; tone: string; hint: string }> = {
  pendente: {
    label: 'Verificado (hash)',
    tone: 'border-line-strong bg-surface-2 text-muted',
    hint: 'Formato, tamanho e SHA-256 conferidos. A análise antivírus acontece no app do desktop.',
  },
  aprovado: {
    label: 'Aprovado',
    tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    hint: 'Nenhuma ameaça encontrada na análise antivírus.',
  },
  analise: {
    label: 'Em análise',
    tone: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
    hint: 'O arquivo está na fila de análise.',
  },
  suspeito: {
    label: 'Suspeito',
    tone: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    hint: 'O antivírus levantou suspeita. Instale apenas se confiar na origem.',
  },
  bloqueado: {
    label: 'Bloqueado',
    tone: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
    hint: 'O antivírus detectou uma ameaça. O download foi bloqueado.',
  },
}

export function scanMeta(status?: string | null) {
  return SCAN_META[(status as ScanStatus) ?? 'pendente'] ?? SCAN_META.pendente
}

/** Extensão composta (tar.gz) ou simples, em minúsculas. */
export function fileExtension(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.tar.gz')) return 'tar.gz'
  const match = lower.match(/\.([a-z0-9]+)$/)
  return match ? match[1] : ''
}

export function validateBinary(file: { name: string; size: number }): string[] {
  const problems: string[] = []
  const ext = fileExtension(file.name)
  if (!ext) {
    problems.push(`“${file.name}” não tem extensão de arquivo reconhecida.`)
  } else if (!ALLOWED.has(ext)) {
    problems.push(`O formato .${ext} não é aceito. Use ${[...ALLOWED].slice(0, 12).map((e) => `.${e}`).join(', ')}…`)
  }
  if (file.size === 0) problems.push(`“${file.name}” está vazio.`)
  if (file.size > MAX_BINARY_BYTES) {
    problems.push(
      `“${file.name}” tem ${(file.size / 1024 / 1024).toFixed(1)} MB. O limite por arquivo é ${MAX_BINARY_BYTES / 1024 / 1024} MB.`,
    )
  }
  return problems
}

export async function sha256Hex(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function shortHash(hash?: string | null, size = 16): string {
  if (!hash) return '—'
  return hash.length <= size ? hash : `${hash.slice(0, size)}…`
}
