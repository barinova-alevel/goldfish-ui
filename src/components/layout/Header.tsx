import { Link, useNavigate } from 'react-router-dom'
import { LogIn, LogOut, Menu } from 'lucide-react'
import { blazorUiUrl, githubUrl } from '../../auth/demoUser'
import { useAuth } from '../../auth/useAuth'

const projectLinkClass =
  'inline-flex min-h-11 items-center rounded-md border border-brown bg-transparent px-2.5 py-2 text-xs font-semibold text-brown transition-colors hover:bg-tan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown sm:min-h-0 sm:px-4 sm:text-sm'

const accountButtonClass =
  'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-transparent bg-brown px-3 py-2 text-sm font-semibold text-cream transition-colors hover:bg-brown-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown sm:min-h-0 sm:px-4'

const mobileTextLinkClass =
  'max-lg:min-h-11! max-lg:rounded-none! max-lg:border-0! max-lg:bg-transparent! max-lg:px-1! max-lg:py-2! max-lg:text-sm! max-lg:font-medium! max-lg:text-brown! max-lg:underline! max-lg:underline-offset-4! max-lg:hover:bg-transparent! max-lg:hover:text-brown-light!'

interface HeaderProps {
  menuOpen?: boolean
  onOpenMenu?: () => void
}

export function Header({ menuOpen = false, onOpenMenu }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 flex w-full shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-brown/10 bg-white px-4 py-2 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {onOpenMenu ? (
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={onOpenMenu}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-brown hover:bg-tan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown lg:hidden"
          >
            <Menu className="size-6" aria-hidden="true" />
          </button>
        ) : null}
        <h1 className="min-w-0 font-script text-xl leading-tight text-brown sm:text-2xl">
          Self Finance Manager
        </h1>
      </div>

      <div className="flex w-full min-w-0 flex-wrap items-center justify-start gap-2 sm:w-auto">
        <nav aria-label="Project links" className="flex flex-wrap items-center justify-start gap-2">
          <a
            href={blazorUiUrl}
            data-testid="blazor-ui-link"
            target="_blank"
            rel="noopener noreferrer"
            className={`${projectLinkClass} ${mobileTextLinkClass}`}
          >
            View Blazor UI
          </a>
          <a
            href={githubUrl}
            data-testid="github-link"
            target="_blank"
            rel="noopener noreferrer"
            className={`${projectLinkClass} ${mobileTextLinkClass}`}
          >
            View on GitHub
          </a>
        </nav>

        {user ? (
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="max-w-[7.5rem] truncate text-sm font-medium text-brown sm:max-w-[14rem] lg:max-w-none">
              {user.name}
            </span>
            <button type="button" onClick={handleLogout} className={accountButtonClass}>
              <LogOut className="size-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className={`${accountButtonClass} ${mobileTextLinkClass}`}>
            <LogIn className="size-4 max-lg:hidden" aria-hidden="true" />
            Login
          </Link>
        )}
      </div>
    </header>
  )
}
