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
import { UpdateDialog } from './components/UpdateDialog'
import { isDesktop } from './lib/desktop'

export default function App() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [location.pathname, location.search])

  // A landing page é o site público; a loja em si vive em /home.
  // Dentro do app do desktop, a loja abre direto, sem passar pela landing.
  if (location.pathname === '/' && !isDesktop) return <Landing />
  if (location.pathname === '/') return <Navigate to="/home" replace />

  return (
    <div className="app-bg flex h-full w-full overflow-hidden text-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main ref={mainRef} className="scroll-area flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0">
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
        className="mt-6 inline-flex rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white"
      >
        Voltar ao início
      </Link>
    </div>
  )
}
