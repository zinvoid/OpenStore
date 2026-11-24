export type OSKey = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'web' | 'unknown'

export interface PlatformMeta {
  key: OSKey
  label: string
  short: string
  extensions: string[]
}

export const PLATFORMS: Record<string, PlatformMeta> = {
  windows: { key: 'windows', label: 'Windows', short: 'Windows', extensions: ['exe', 'msi', 'msix', 'zip'] },
  macos: { key: 'macos', label: 'macOS', short: 'macOS', extensions: ['dmg', 'pkg', 'zip'] },
  linux: { key: 'linux', label: 'Linux', short: 'Linux', extensions: ['deb', 'rpm', 'appimage', 'tar.gz', 'zip', 'flatpak'] },
  android: { key: 'android', label: 'Android', short: 'Android', extensions: ['apk', 'aab'] },
  ios: { key: 'ios', label: 'iOS', short: 'iOS', extensions: ['ipa'] },
  web: { key: 'web', label: 'Web', short: 'Web', extensions: ['html', 'url'] },
}

/** Detecta o sistema do usuário a partir do navegador / Electron. */
export function detectOS(): OSKey {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform
  const hint = `${platform ?? ''} ${navigator.platform ?? ''} ${ua}`.toLowerCase()

  if (/android/.test(hint)) return 'android'
  if (/iphone|ipad|ipod|ios/.test(hint)) return 'ios'
  if (/win/.test(hint)) return 'windows'
  if (/mac/.test(hint)) return 'macos'
  if (/linux|x11|ubuntu|fedora|debian|arch/.test(hint)) return 'linux'
  return 'unknown'
}

export function osLabel(os: OSKey): string {
  return PLATFORMS[os]?.label ?? 'seu sistema'
}

const ARCH_LABEL: Record<string, string> = {
  x64: 'x64',
  x86: 'x86',
  arm64: 'ARM64',
  universal: 'Universal',
}

export function archLabel(arch?: string | null): string {
  if (!arch) return 'Universal'
  return ARCH_LABEL[arch] ?? arch
}

export function formatLabel(format?: string | null): string {
  if (!format) return 'Arquivo'
  const f = format.toLowerCase()
  if (f === 'appimage') return 'AppImage'
  if (f === 'deb') return 'DEB'
  if (f === 'rpm') return 'RPM'
  if (f === 'tar.gz') return 'TAR.GZ'
  if (f === 'msi') return 'MSI'
  if (f === 'msix') return 'MSIX'
  if (f === 'exe') return 'EXE'
  if (f === 'dmg') return 'DMG'
  if (f === 'apk') return 'APK'
  return f.toUpperCase()
}

/** Extensão do arquivo a partir de uma URL / nome. */
export function extensionOf(nameOrUrl: string): string {
  const clean = nameOrUrl.split('?')[0].split('#')[0]
  const base = clean.split('/').pop() ?? ''
  const lower = base.toLowerCase()
  if (lower.endsWith('.tar.gz')) return 'tar.gz'
  const ext = lower.includes('.') ? lower.split('.').pop() ?? '' : ''
  return ext
}

/** Plataforma inferida pela extensão do arquivo. */
export function platformFromExtension(ext: string): string | null {
  const e = ext.toLowerCase()
  if (['exe', 'msi', 'msix'].includes(e)) return 'windows'
  if (['dmg', 'pkg'].includes(e)) return 'macos'
  if (['deb', 'rpm', 'appimage', 'flatpak', 'tar.gz'].includes(e)) return 'linux'
  if (['apk', 'aab'].includes(e)) return 'android'
  if (e === 'ipa') return 'ios'
  return null
}
