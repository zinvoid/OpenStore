import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GhostMark } from '../GhostLogo'
import { GithubIcon, MoonIcon, SunIcon } from '../Icons'
import { BUILD_VERSION } from '../../lib/releases'
import { useTheme } from '../../lib/theme'
import { GITHUB_ISSUES, GITHUB_RELEASES, GITHUB_URL, LICENSE_NAME } from '../../lib/site'
import { DOCS } from '../../lib/docs'

const NAV: { to: string; label: string; active: (path: string) => boolean }[] = [
  { to: '/guia', label: 'Guia', active: (path) => path === '/guia' },
  {
    to: '/guia/configuracoes-e-arquivos',
    label: 'Referência',
    active: (path) => path.startsWith('/guia/'),
  },
  { to: '/download', label: 'Download', active: (path) => path === '/download' },
]

function ThemeButton() {
  const { resolved, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      className="site-icon-btn"
      title={resolved === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
      aria-label={resolved === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
    >
      {resolved === 'dark' ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </button>
  )
}

function SiteHeader() {
  const { pathname } = useLocation()

  return (
    <header className="site-header">
      <div className="site-container site-header-inner">
        <Link to="/" className="site-brand" aria-label="OpenStore">
          <GhostMark className="size-[40px]" />
          <span>OpenStore</span>
        </Link>
        <span className="site-version hidden sm:inline-flex">v{BUILD_VERSION}</span>

        <nav className="site-nav hidden md:flex" aria-label="Seções do site">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="site-nav-link"
              aria-current={item.active(pathname) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-actions">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="site-icon-btn"
            title="Repositório no GitHub"
            aria-label="Repositório no GitHub"
          >
            <GithubIcon className="size-4" />
          </a>
          <ThemeButton />
          <Link to="/home" className="site-btn site-btn-primary site-btn-sm">
            Abrir a loja
          </Link>
        </div>
      </div>
    </header>
  )
}

function SiteFooter() {
  const guides = DOCS.filter((doc) => doc.group === 'Guia')
  const reference = DOCS.filter((doc) => doc.group === 'Referência')

  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="site-footer-inner">
          <div>
            <p className="site-foot-brand">
              <GhostMark className="size-8" />
              OpenStore
            </p>
            <p className="site-foot-text">
              Loja aberta de aplicativos. Qualquer pessoa publica, qualquer pessoa instala, sem comissão e sem
              fila de aprovação. Distribuída sob a licença {LICENSE_NAME}.
            </p>
          </div>

          <div>
            <p className="site-foot-title">Guia</p>
            {guides.map((doc) => (
              <Link key={doc.slug} to={`/guia/${doc.slug}`} className="site-foot-link">
                {doc.nav}
              </Link>
            ))}
            <Link to="/download" className="site-foot-link">
              Download
            </Link>
          </div>

          <div>
            <p className="site-foot-title">Referência</p>
            {reference.map((doc) => (
              <Link key={doc.slug} to={`/guia/${doc.slug}`} className="site-foot-link">
                {doc.nav}
              </Link>
            ))}
          </div>

          <div>
            <p className="site-foot-title">Projeto</p>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="site-foot-link">
              Código no GitHub
            </a>
            <a href={GITHUB_RELEASES} target="_blank" rel="noreferrer" className="site-foot-link">
              Versões publicadas
            </a>
            <a href={GITHUB_ISSUES} target="_blank" rel="noreferrer" className="site-foot-link">
              Problemas e sugestões
            </a>
            <Link to="/home" className="site-foot-link">
              Abrir a loja
            </Link>
          </div>
        </div>

        <div className="site-foot-bottom">
          <span>
            © {new Date().getFullYear()} OpenStore · licença {LICENSE_NAME}
          </span>
          <span>
            Windows e Linux · versão {BUILD_VERSION}
          </span>
        </div>
      </div>
    </footer>
  )
}

/** Área pública do site: landing, guias e download. Rola por conta própria. */
export function SiteLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    rootRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="site" ref={rootRef}>
      <SiteHeader />
      <main className="site-main">{children}</main>
      <SiteFooter />
    </div>
  )
}

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
