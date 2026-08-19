import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function MainLayout() {
  return (
    <div className="flex min-h-full">
      <Sidebar />

      <div className="ml-64 flex min-h-full min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 bg-white p-6">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  )
}
