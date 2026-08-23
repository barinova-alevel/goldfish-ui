import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CircleHelp, LogIn, Mail } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { isValidEmail } from '../auth/validation'
import { AuthCard } from '../components/auth/AuthCard'
import { AuthField } from '../components/auth/AuthField'

export function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextEmailError = !email.trim()
      ? 'Email is required'
      : isValidEmail(email)
        ? ''
        : 'Enter a valid email address'

    setEmailError(nextEmailError)
    setFormError('')
    setSuccessMessage('')

    if (nextEmailError) {
      return
    }

    setSubmitting(true)
    const response = await forgotPassword(email.trim())
    setSubmitting(false)

    if (!response.success) {
      setFormError(response.message || 'Unable to send reset instructions')
      return
    }

    setSuccessMessage(response.message || 'Password reset instructions sent to email')
  }

  return (
    <AuthCard title="Forgot Password" icon={CircleHelp}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {formError}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {successMessage}
          </p>
        ) : null}

        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your registered email"
          icon={Mail}
          autoComplete="email"
          error={emailError}
        />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brown px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-brown-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Send Reset Instructions'}
        </button>
      </form>

      <div className="mt-6 border-t border-brown/10 pt-5 text-center">
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 text-sm font-medium text-brown hover:underline"
        >
          <LogIn className="size-4" aria-hidden="true" />
          Back to Login
        </Link>
      </div>
    </AuthCard>
  )
}
