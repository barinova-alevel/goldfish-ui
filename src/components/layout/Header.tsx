import { Link, useNavigate } from 'react-router-dom'
import { LogIn, LogOut } from 'lucide-react'
import { blazorUiUrl, githubUrl } from '../../auth/demoUser'
import { useAuth } from '../../auth/useAuth'

const projectLinkClass =
  'inline-flex items-center rounded-md border border-brown bg-transparent px-4 py-2 text-sm font-semibold text-brown transition-colors hover:bg-tan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown'

const accountButtonClass =
  'inline-flex items-center gap-2 rounded-md border border-transparent bg-brown px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-brown-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown'

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 flex w-full shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-brown/10 bg-white px-6 py-2">
      <h1 className="font-script text-2xl leading-tight text-brown">Self Finance Manager</h1>

      <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto">
        <nav aria-label="Project links" className="flex flex-wrap items-center justify-start gap-2">
          <a
            href={blazorUiUrl}
            data-testid="blazor-ui-link"
            target="_blank"
            rel="noopener noreferrer"
            className={projectLinkClass}
          >
            View Blazor UI
          </a>
          <a
            href={githubUrl}
            data-testid="github-link"
            target="_blank"
            rel="noopener noreferrer"
            className={projectLinkClass}
          >
            View on GitHub
          </a>
        </nav>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-brown">{user.name}</span>
            <button type="button" onClick={handleLogout} className={accountButtonClass}>
              <LogOut className="size-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className={accountButtonClass}>
            <LogIn className="size-4" aria-hidden="true" />
            Login
          </Link>
        )}
      </div>
    </header>
  )
}
