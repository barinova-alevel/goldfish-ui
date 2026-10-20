import { useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CircleHelp, KeyRound, Lock, LogIn, Mail, UserPlus } from 'lucide-react'
import { blazorUiUrl, demoLoginDelayMs, githubUrl, loadDemoCredentials } from '../auth/demoUser'
import { useAuth } from '../auth/useAuth'
import { isValidEmail, minPasswordLength } from '../auth/validation'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthField } from '../components/auth/AuthField'

export function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [demoPending, setDemoPending] = useState(false)
  const [demoStatus, setDemoStatus] = useState('')
  const demoLock = useRef(false)

  if (user) {
    return <Navigate to={from} replace />
  }

  const fieldsLocked = submitting || demoPending

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await signIn(email, password)
  }

  async function signIn(nextEmail: string, nextPassword: string) {
    const trimmedEmail = nextEmail.trim()
    const nextEmailError = !trimmedEmail
      ? 'Email is required'
      : isValidEmail(trimmedEmail)
        ? ''
        : 'Enter a valid email address'
    const nextPasswordError = !nextPassword
      ? 'Password is required'
      : nextPassword.length < minPasswordLength
        ? `Password must be at least ${minPasswordLength} characters`
        : ''

    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    setFormError('')

    if (nextEmailError || nextPasswordError) {
      return
    }

    setSubmitting(true)
    const response = await login(trimmedEmail, nextPassword)
    setSubmitting(false)

    if (!response.success || !response.user) {
      setFormError(response.message || 'Invalid credentials')
      return
    }

    navigate(from, { replace: true })
  }

  async function handleDemoLogin() {
    if (demoLock.current || submitting) {
      return
    }

    demoLock.current = true
    setFormError('')
    setEmailError('')
    setPasswordError('')
    setDemoPending(true)

    try {
      const credentials = await loadDemoCredentials()
      if (!credentials) {
        setFormError('Demo login is not configured.')
        return
      }

      setEmail(credentials.email)
      setPassword(credentials.password)
      setDemoStatus('Demo credentials loaded')

      await new Promise((resolve) => window.setTimeout(resolve, demoLoginDelayMs))
      await signIn(credentials.email, credentials.password)
    } finally {
      demoLock.current = false
      setDemoPending(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <AuthCard title="Login" icon={Lock} testId="login-page" headingTestId="login-heading">
        <form data-testid="login-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError ? (
            <p
              data-testid="login-form-error"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {formError}
            </p>
          ) : null}

          <AuthField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="Enter your email"
            icon={Mail}
            autoComplete="email"
            error={emailError}
            testId="login-email"
            errorTestId="login-email-error"
            disabled={fieldsLocked}
          />

          <AuthField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            icon={KeyRound}
            autoComplete="current-password"
            error={passwordError}
            testId="login-password"
            errorTestId="login-password-error"
            disabled={fieldsLocked}
          />

          {demoStatus ? (
            <p
              data-testid="login-demo-status"
              role="status"
              className="text-center text-xs text-brown-muted"
            >
              {demoStatus}
            </p>
          ) : null}

          <button
            type="submit"
            data-testid="login-submit"
            disabled={fieldsLocked}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brown px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-brown-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown disabled:opacity-60"
          >
            <LogIn className="size-4" aria-hidden="true" />
            {submitting ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/forgot-password"
            data-testid="login-forgot-password"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brown hover:underline"
          >
            <CircleHelp className="size-4" aria-hidden="true" />
            Forgot Password?
          </Link>
        </div>

        <div className="mt-6 border-t border-brown/10 pt-5 text-center">
          <p className="mb-3 text-sm text-brown-muted">Don't have an account?</p>
          <Link
            to="/register"
            data-testid="login-sign-up"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-brown/20 bg-white px-4 py-2 text-sm font-semibold text-brown transition-colors hover:bg-tan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
          >
            <UserPlus className="size-4" aria-hidden="true" />
            Sign Up
          </Link>
        </div>
      </AuthCard>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-brown-muted">
        <button
          type="button"
          data-testid="login-demo"
          disabled={fieldsLocked}
          onClick={handleDemoLogin}
          className="font-medium underline-offset-2 hover:text-brown hover:underline disabled:opacity-60"
        >
          Login with demo user
        </button>
        <a
          href={blazorUiUrl}
          data-testid="login-blazor"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:text-brown hover:underline"
        >
          View Blazor UI
        </a>
        <a
          href={githubUrl}
          data-testid="login-github"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:text-brown hover:underline"
        >
          View on GitHub
        </a>
      </div>
    </div>
  )
}
