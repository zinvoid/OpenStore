import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation, Link } from 'react-router-dom'
import { Sidebar, MobileNav } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import Home from './pages/Home'
import Browse from './pages/Browse'
import AppDetail from './pages/AppDetail'
import Publish from './pages/Publish'
import Library from './pages/Library'
import SignIn from './pages/SignIn'
import Landing from './pages/Landing'
import GuideHub, { GuidePage } from './pages/Guide'
import DownloadPage from './pages/Download'
import { UpdateDialog } from './components/UpdateDialog'
import { isDesktop } from './lib/desktop'

export default function App() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [location.pathname, location.search])

  // Site público (landing, guias e download) roda fora do shell da loja.
  // A loja em si vive em /home; dentro do app do desktop ela abre direto.
  const isPublic =
    location.pathname === '/' ||
    location.pathname === '/download' ||
    location.pathname === '/guia' ||
    location.pathname.startsWith('/guia/')

  if (isPublic) {
    if (location.pathname === '/' && isDesktop) return <Navigate to="/home" replace />
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/guia" element={<GuideHub />} />
        <Route path="/guia/:slug" element={<GuidePage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="*" element={<Navigate to="/guia" replace />} />
      </Routes>
    )
  }

  return (
    <div className="app-bg relative flex h-full w-full overflow-hidden text-ink">
      <div className="app-grain pointer-events-none absolute inset-0 z-0" aria-hidden="true" />
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main
          ref={mainRef}
          className="scroll-area flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-6"
        >
          <div key={location.pathname} className="page-enter">
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/apps" element={<Browse />} />
              <Route path="/app/:slug" element={<AppDetail />} />
              <Route path="/publish" element={<Publish />} />
              <Route path="/publish/:slug" element={<Publish />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/library" element={<Library />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
      <MobileNav />
      <UpdateDialog />
    </div>
  )
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="font-display text-5xl font-semibold text-accent">404</p>
      <h1 className="mt-3 text-lg font-semibold">Esta página assombrou-se</h1>
      <p className="mt-2 text-[13px] text-muted">
        O conteúdo que você procura não existe ou foi removido da loja.
      </p>
      <Link
        to="/home"
        className="mt-6 inline-flex rounded-md bg-ink px-4 py-2 text-[13px] font-semibold text-bg"
      >
        Voltar ao início
      </Link>
    </div>
  )
}
