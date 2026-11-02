import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Briefcase,
  CalendarDays,
  CalendarRange,
  Home,
  Tag,
  X,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: 'SFMB', icon: Home, end: true },
  { to: '/operations', label: 'Operations', icon: Briefcase },
  { to: '/operation-types', label: 'Operation Types', icon: Tag },
  { to: '/daily-report', label: 'Daily Report', icon: CalendarDays },
  { to: '/period-report', label: 'Period Report', icon: CalendarRange },
]

function navLinkClass(isActive: boolean) {
  return [
    'flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors lg:min-h-0',
    isActive
      ? 'bg-brown/15 text-brown'
      : 'text-brown/80 hover:bg-brown/10 hover:text-brown',
  ].join(' ')
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const drawerRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname
      onClose()
    }
  }, [pathname, onClose])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return
    }

    let media: MediaQueryList
    try {
      media = window.matchMedia('(min-width: 1024px)')
    } catch {
      return
    }

    function onChange() {
      if (media.matches) {
        onClose()
      }
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [onClose])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawerRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col bg-gradient-to-b from-cream to-tan shadow-md lg:flex">
        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-4">
          <NavList />
        </nav>
      </aside>

      <div
        id="mobile-navigation"
        className={`fixed inset-0 z-50 overflow-hidden lg:hidden ${open ? '' : 'pointer-events-none'}`}
        inert={open ? undefined : true}
        aria-hidden={open ? undefined : true}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close navigation"
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />
        <aside
          ref={drawerRef}
          tabIndex={-1}
          className={`absolute inset-y-0 left-0 flex h-full w-64 max-w-[85vw] flex-col bg-gradient-to-b from-cream to-tan shadow-xl transition-transform duration-200 ease-out outline-none ${open ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-brown/10 px-3 py-2">
            <p className="min-w-0 font-script text-2xl leading-tight text-brown">Self Finance Manager</p>
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-brown hover:bg-brown/10"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
            <NavList onNavigate={onClose} />
          </nav>
        </aside>
      </div>
    </>
  )
}
