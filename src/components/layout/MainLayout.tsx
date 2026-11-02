import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function MainLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const openNav = useCallback(() => setNavOpen(true), [])
  const closeNav = useCallback(() => setNavOpen(false), [])

  return (
    <div className="flex min-h-full flex-col">
      <Header menuOpen={navOpen} onOpenMenu={openNav} />

      <div className="flex min-h-0 min-w-0 flex-1">
        <Sidebar open={navOpen} onClose={closeNav} />
        <main className="min-w-0 flex-1 overflow-x-clip bg-white p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  )
}
