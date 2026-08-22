import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function MainLayout() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />

      <div className="flex min-h-0 min-w-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 bg-white p-6">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  )
}
