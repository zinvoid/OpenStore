import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { LogoutIcon, SearchIcon, UploadIcon } from './Icons'
import { GhostMark } from './GhostLogo'
import { ThemeToggle } from './ThemeToggle'
import { WindowControls } from './WindowControls'
import { signOut, useAccount } from '../lib/auth'
import { desktop, isDesktop } from '../lib/desktop'

export function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const account = useAccount()
  const frameless = isDesktop && desktop?.platform === 'win32'

  useEffect(() => {
    setQuery(params.get('q') ?? '')
  }, [params])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/apps?q=${encodeURIComponent(q)}` : '/apps')
  }

  return (
    <header
      className="app-drag glass-float relative z-20 mx-3 mt-3 flex h-[56px] shrink-0 items-center gap-2.5 rounded-[20px] px-3 sm:gap-3 sm:px-4"
      onDoubleClick={(event) => {
        if (!frameless) return
        if ((event.target as HTMLElement).closest('a, button, input, select, form')) return
        void desktop?.windowControl('maximize')
      }}
    >
      <Link to="/home" className="flex shrink-0 items-center gap-2.5 md:hidden" aria-label="OpenStore — início">
        <GhostMark className="size-9" glow />
      </Link>
      <Link to="/home" className="hidden shrink-0 items-center gap-2.5 rounded-xl px-1 py-1 md:flex" aria-label="OpenStore — início">
        <GhostMark className="size-9" glow />
        <span className="font-display text-[15px] font-semibold tracking-[-0.02em]">OpenStore</span>
      </Link>

      <div className="flex flex-1 justify-center">
        <form onSubmit={submit} className="relative w-full max-w-[560px]">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-[15px] -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar apps, ferramentas e categorias"
            aria-label="Pesquisar"
            className="field h-10 w-full rounded-full pl-10 pr-12 text-[13px]"
          />
          <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-line px-1.5 py-0.5 text-[10px] text-muted sm:block">
            /
          </kbd>
        </form>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Link
          to="/publish"
          className="glass-btn glass-btn-accent hidden items-center gap-1.5 px-3.5 py-2 text-[12px] font-semibold sm:flex"
        >
          <UploadIcon className="size-3.5" />
          Publicar app
        </Link>
        <ThemeToggle />
        {account ? (
          <div className="flex items-center gap-1">
            <span
              className="glass-chip hidden max-w-[140px] truncate !px-2.5 !py-1 !text-[11px] !font-semibold !text-ink-soft sm:block"
              title={`Conectado como @${account.username}`}
            >
              @{account.username}
            </span>
            <button
              type="button"
              onClick={() => {
                signOut()
                navigate('/home')
              }}
              aria-label="Sair da conta"
              title="Sair"
              className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-white/10 hover:text-ink"
            >
              <LogoutIcon className="size-4" />
            </button>
          </div>
        ) : (
          <Link to="/signin" className="glass-btn px-3.5 py-2 text-[11.5px] font-semibold">
            Entrar
          </Link>
        )}
      </div>
      <WindowControls />
      {location.pathname === '/publish' && (
        <span className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent" />
      )}
    </header>
  )
}
