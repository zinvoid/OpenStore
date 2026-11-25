import { NavLink, useLocation } from 'react-router-dom'
import { GhostBadge } from './GhostLogo'
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
    <aside className="glass-panel relative m-3 mr-0 hidden w-[86px] shrink-0 flex-col items-center rounded-[26px] py-4 md:flex">
      <NavLink to="/home" className="mb-5 block" aria-label="OpenStore — início">
        <GhostBadge size={58} />
      </NavLink>

      <nav className="flex w-full flex-col items-center gap-1 px-1.5">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = isActive(to)
          return (
            <NavLink key={to} to={to} className="group w-full">
              <span
                className={`flex w-full flex-col items-center gap-1.5 rounded-2xl py-2 text-[10px] font-medium transition-colors duration-200 ${
                  active ? 'text-ink' : 'text-muted group-hover:text-ink-soft'
                }`}
              >
                <span
                  className={`grid size-9 place-items-center rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-accent text-white shadow-[0_10px_22px_-12px_rgba(107,87,245,0.9)]'
                      : 'group-hover:bg-white/10 dark:group-hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="size-[18px]" />
                </span>
                <span className="tracking-[-0.01em]">{label}</span>
              </span>
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-1 px-2 text-center text-[9px] leading-tight text-muted/70">
        {!isDesktop && (
          <NavLink to="/" title="Site público" className="rounded-full px-2 py-1 font-medium text-muted hover:text-ink">
            site
          </NavLink>
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
    <nav className="glass-float fixed inset-x-3 bottom-3 z-30 flex items-stretch justify-around rounded-[22px] px-1 pb-[calc(env(safe-area-inset-bottom)+4px)] pt-1.5 md:hidden">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = isActive(to)
        return (
          <NavLink
            key={to}
            to={to}
            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[9.5px] font-medium transition-colors ${
              active ? 'text-ink' : 'text-muted'
            }`}
          >
            <span className={`grid size-8 place-items-center rounded-xl transition ${active ? 'bg-accent text-white' : ''}`}>
              <Icon className="size-[17px]" />
            </span>
            <span>{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
