import { NavLink } from 'react-router-dom'
import { GhostMark } from './GhostLogo'
import { BUILD_VERSION } from '../lib/releases'
import { GridIcon, HomeIcon, LibraryIcon, SparkIcon, UploadIcon } from './Icons'

const NAV = [
  { to: '/home', label: 'Início', icon: HomeIcon, end: true },
  { to: '/apps', label: 'Apps', icon: GridIcon, end: false },
  { to: '/apps?sort=recent', label: 'Novidades', icon: SparkIcon, end: false },
  { to: '/library', label: 'Meus apps', icon: LibraryIcon, end: false },
  { to: '/publish', label: 'Publicar', icon: UploadIcon, end: false },
]

function itemClass(active: boolean) {
  return [
    'flex w-[62px] flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition',
    active ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:bg-surface-2 hover:text-ink',
  ].join(' ')
}

export function Sidebar() {
  return (
    <aside className="hidden w-[78px] shrink-0 flex-col items-center gap-0.5 border-r border-line bg-surface-2 py-3 md:flex">
      <NavLink to="/home" className="mb-3 flex flex-col items-center gap-1" aria-label="OpenStore — início">
        <GhostMark className="size-8" glow />
      </NavLink>
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => itemClass(isActive)}>
          <Icon className="size-[18px]" />
          <span>{label}</span>
        </NavLink>
      ))}
      <div className="mt-auto flex flex-col items-center gap-2 px-2 text-center text-[9px] leading-tight text-muted/70">
        <NavLink to="/" title="Site público" className="text-[9px] font-medium text-muted hover:text-ink">
          site
        </NavLink>
        beta
        <br />
        {BUILD_VERSION}
      </div>
    </aside>
  )
}

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur md:hidden">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[9.5px] font-medium ${
              isActive ? 'text-accent-ink' : 'text-muted'
            }`
          }
        >
          <Icon className="size-[18px]" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
