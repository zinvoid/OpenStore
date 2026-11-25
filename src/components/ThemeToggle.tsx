import { MoonIcon, SunIcon } from './Icons'
import { useTheme } from '../lib/theme'

/** Alterna entre o tema claro e o escuro. A escolha fica salva no navegador. */
export function ThemeToggle({ className = 'size-8' }: { className?: string }) {
  const { resolved, toggle } = useTheme()
  const dark = resolved === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={dark ? 'Modo claro' : 'Modo escuro'}
      className={`glass-icon ${className}`}
    >
      {dark ? <SunIcon className="size-[15px]" /> : <MoonIcon className="size-[15px]" />}
    </button>
  )
}
