import { NavLink } from 'react-router-dom'
import {
  Briefcase,
  CalendarDays,
  CalendarRange,
  Home,
  Tag,
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
    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brown/15 text-brown'
      : 'text-brown/80 hover:bg-brown/10 hover:text-brown',
  ].join(' ')
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-gradient-to-b from-cream to-tan shadow-md">
      <div className="border-b border-brown/10 px-5 py-5">
        <h1 className="font-script text-2xl leading-tight text-brown">
          Self Finance Manager
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={({ isActive }) => navLinkClass(isActive)}>
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
