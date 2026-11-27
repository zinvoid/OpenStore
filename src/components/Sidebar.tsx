import { NavLink, useLocation } from 'react-router-dom'
import { GhostMark } from './GhostLogo'
import { BUILD_VERSION } from '../lib/releases'
import { isDesktop } from '../lib/desktop'
import { GridIcon, HomeIcon, LibraryIcon, SparkIcon, UploadIcon } from './Icons'

const NAV = [
  { to: '/home', label: 'Início', icon: HomeIcon },
  { to: '/apps', label: 'Apps', icon: GridIcon },
  { to: '/apps?sort=recent', label: 'Novidades', icon: SparkIcon },
  { to: '/library', label: 'Meus apps', icon: LibraryIcon },
  { to: '/publish', label: 'Publicar', icon: UploadIcon },
]

/** "Apps" e "Novidades" vivem na mesma rota: o filtro da URL decide quem está ativo. */
function useActiveItem() {
  const { pathname, search } = useLocation()
  const recent = new URLSearchParams(search).get('sort') === 'recent'
  return (to: string) => {
    const [path, query] = to.split('?')
    if (path === '/apps') {
      if (pathname !== '/apps') return false
      return query?.includes('sort=recent') ? recent : !recent
    }
    return pathname === path || pathname.startsWith(`${path}/`)
  }
}

export function Sidebar() {
  const isActive = useActiveItem()

  return (
    <aside className="glass-panel relative m-3 mr-0 hidden w-[86px] shrink-0 flex-col items-center rounded-[12px] py-4 md:flex">
      <NavLink to="/home" className="mb-6 block" aria-label="OpenStore — início">
        <GhostMark className="size-[64px]" />
      </NavLink>

      <nav className="flex w-full flex-col items-center gap-1.5 px-2">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = isActive(to)
          return (
            <NavLink
              key={to}
              to={to}
              title={label}
              aria-label={label}
              className="group grid w-full place-items-center"
            >
              <span
                className={`grid size-11 place-items-center rounded-2xl transition-colors duration-200 ${
                  active
                    ? 'bg-accent/12 text-accent dark:bg-accent/18'
                    : 'text-muted group-hover:bg-ink/[0.05] group-hover:text-ink-soft dark:group-hover:bg-white/[0.06]'
                }`}
              >
                <Icon className="size-[23px]" />
              </span>
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-1 px-2 text-center text-[9px] leading-tight text-muted/70">
        {!isDesktop && (
          <>
            <NavLink to="/" title="Site público" className="rounded-full px-2 py-1 font-medium text-muted hover:text-ink">
              site
            </NavLink>
            <NavLink to="/guia" title="Guias" className="rounded-full px-2 py-1 font-medium text-muted hover:text-ink">
              guias
            </NavLink>
          </>
        )}
        <span className="glass-chip !px-2 !py-0.5 !text-[8.5px] uppercase tracking-[0.1em]">beta</span>
        <span className="tabular-nums">{BUILD_VERSION}</span>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const isActive = useActiveItem()

  return (
    <nav className="glass-float fixed inset-x-3 bottom-3 z-30 flex items-stretch justify-around rounded-[12px] px-1 pb-[calc(env(safe-area-inset-bottom)+4px)] pt-1.5 md:hidden">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = isActive(to)
        return (
          <NavLink
            key={to}
            to={to}
            title={label}
            aria-label={label}
            className={`grid flex-1 place-items-center rounded-2xl py-2 transition-colors ${
              active ? 'text-accent' : 'text-muted'
            }`}
          >
            <span
              className={`grid size-10 place-items-center rounded-xl transition ${
                active ? 'bg-accent/12 dark:bg-accent/18' : ''
              }`}
            >
              <Icon className="size-[22px]" />
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}
