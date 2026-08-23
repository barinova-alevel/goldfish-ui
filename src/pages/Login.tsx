import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CircleHelp, KeyRound, Lock, LogIn, Mail, UserPlus } from 'lucide-react'
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

  if (user) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextEmailError = !email.trim()
      ? 'Email is required'
      : isValidEmail(email)
        ? ''
        : 'Enter a valid email address'
    const nextPasswordError = !password
      ? 'Password is required'
      : password.length < minPasswordLength
        ? `Password must be at least ${minPasswordLength} characters`
        : ''

    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    setFormError('')

    if (nextEmailError || nextPasswordError) {
      return
    }

    setSubmitting(true)
    const response = await login(email.trim(), password)
    setSubmitting(false)

    if (!response.success || !response.user) {
      setFormError(response.message || 'Invalid credentials')
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <AuthCard title="Login" icon={Lock}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
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
        />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brown px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-brown-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown disabled:opacity-60"
        >
          <LogIn className="size-4" aria-hidden="true" />
          {submitting ? 'Signing in…' : 'Login'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link
          to="/forgot-password"
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
          className="inline-flex items-center justify-center gap-2 rounded-md border border-brown/20 bg-white px-4 py-2 text-sm font-semibold text-brown transition-colors hover:bg-tan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <UserPlus className="size-4" aria-hidden="true" />
          Sign Up
        </Link>
      </div>
    </AuthCard>
  )
}
