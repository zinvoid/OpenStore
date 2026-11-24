import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { LogoutIcon, SearchIcon, UploadIcon } from './Icons'
import { GhostMark } from './GhostLogo'
import { signOut, useAccount } from '../lib/auth'

export function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const account = useAccount()

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
    <header className="relative z-20 flex h-[56px] shrink-0 items-center gap-3 border-b border-line bg-surface/80 px-3 backdrop-blur-xl sm:px-5">
      <Link to="/home" className="flex items-center gap-2 md:hidden">
        <GhostMark className="size-7" />
      </Link>
      <Link
        to="/home"
        className="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] text-muted transition hover:bg-surface-2 hover:text-ink md:flex"
        title="Voltar ao início"
      >
        Início
      </Link>

      <div className="flex flex-1 justify-center">
        <form onSubmit={submit} className="relative w-full max-w-[540px]">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-[15px] -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar apps, ferramentas e categorias"
            aria-label="Pesquisar"
            className="h-9 w-full rounded-full border border-line-strong bg-surface pl-9 pr-16 text-[13px] text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 py-0.5 text-[10px] text-muted sm:block">
            /
          </kbd>
        </form>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/publish"
          className="glass-btn glass-btn-accent hidden items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold sm:flex"
        >
          <UploadIcon className="size-3.5" />
          Publicar app
        </Link>
        {account ? (
          <div className="flex items-center gap-1">
            <span
              className="hidden max-w-[140px] truncate rounded-full bg-accent-soft px-2.5 py-1 text-[11.5px] font-semibold text-accent-ink ring-1 ring-inset ring-accent/25 sm:block"
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
              className="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
            >
              <LogoutIcon className="size-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/signin"
            className="glass-btn glass-btn-quiet px-3.5 py-1.5 text-[11.5px] font-semibold"
          >
            Entrar
          </Link>
        )}
      </div>
      {location.pathname === '/publish' && (
        <span className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
      )}
    </header>
  )
}
