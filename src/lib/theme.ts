import { useEffect, useState } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const KEY = 'openstore.theme'
const EVENT = 'openstore:theme'

function stored(): ThemeChoice {
  try {
    const value = localStorage.getItem(KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    /* armazenamento indisponível */
  }
  return 'system'
}

export function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

export function resolve(choice: ThemeChoice): ResolvedTheme {
  if (choice === 'system') return prefersDark() ? 'dark' : 'light'
  return choice
}

export function applyTheme(choice: ThemeChoice) {
  if (typeof document === 'undefined') return
  const resolved = resolve(choice)
  const root = document.documentElement
  root.dataset.theme = resolved
  root.style.colorScheme = resolved
  // mantém a barra de status do app desktop coerente com o tema
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0a0c15' : '#eef1fa')
}

/** Lê a escolha salva e aplica antes do primeiro render. */
export function initTheme() {
  applyTheme(stored())
}

export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(() => stored())
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(stored()))

  useEffect(() => {
    const onChange = () => {
      const next = stored()
      setChoice(next)
      setResolved(resolve(next))
    }
    window.addEventListener(EVENT, onChange)
    return () => window.removeEventListener(EVENT, onChange)
  }, [])

  useEffect(() => {
    if (choice !== 'system') return
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return
    const onChange = () => {
      applyTheme('system')
      setResolved(resolve('system'))
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [choice])

  const update = (next: ThemeChoice) => {
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* armazenamento indisponível */
    }
    applyTheme(next)
    setChoice(next)
    setResolved(resolve(next))
    window.dispatchEvent(new Event(EVENT))
  }

  return { choice, resolved, setTheme: update, toggle: () => update(resolved === 'dark' ? 'light' : 'dark') }
}
