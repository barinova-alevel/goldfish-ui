import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { KeyRound, Lock, Mail, User, UserPlus } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { isValidEmail, minPasswordLength } from '../auth/validation'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthField } from '../components/auth/AuthField'

export function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: Record<string, string> = {}
    if (!name.trim()) {
      nextErrors.name = 'Name is required'
    }
    if (!email.trim()) {
      nextErrors.email = 'Email is required'
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address'
    }
    if (!password) {
      nextErrors.password = 'Password is required'
    } else if (password.length < minPasswordLength) {
      nextErrors.password = `Password must be at least ${minPasswordLength} characters`
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password'
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(nextErrors)
    setFormError('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)
    const response = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      confirmPassword,
    })
    setSubmitting(false)

    if (!response.success || !response.user) {
      setFormError(response.message || 'Registration failed')
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <AuthCard title="Sign Up" icon={UserPlus}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {formError}
          </p>
        ) : null}

        <AuthField
          id="name"
          label="Name"
          value={name}
          onChange={setName}
          placeholder="Enter your name"
          icon={User}
          autoComplete="name"
          error={errors.name}
        />

        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email"
          icon={Mail}
          autoComplete="email"
          error={errors.email}
        />

        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          icon={KeyRound}
          autoComplete="new-password"
          error={errors.password}
        />

        <AuthField
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Confirm your password"
          icon={Lock}
          autoComplete="new-password"
          error={errors.confirmPassword}
        />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brown px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-brown-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown disabled:opacity-60"
        >
          <UserPlus className="size-4" aria-hidden="true" />
          {submitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 border-t border-brown/10 pt-5 text-center">
        <p className="mb-3 text-sm text-brown-muted">Already have an account?</p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-brown/20 bg-white px-4 py-2 text-sm font-semibold text-brown transition-colors hover:bg-tan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          Login
        </Link>
      </div>
    </AuthCard>
  )
}
