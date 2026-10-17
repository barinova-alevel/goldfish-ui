import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { blazorUiUrl, githubUrl } from '../../src/auth/demoUser'
import { Login } from '../../src/pages/Login'
import type { AuthContextValue } from '../../src/auth/context'
import type { UserInfo } from '../../src/auth/types'

const loginMock = vi.fn()
const demoState = vi.hoisted(() => ({ password: 'secret1' }))

vi.mock('../../src/auth/demoUser', async () => {
  const actual = await vi.importActual<typeof import('../../src/auth/demoUser')>(
    '../../src/auth/demoUser',
  )
  return {
    ...actual,
    demoPassword: () => demoState.password,
  }
})

const authState: { user: UserInfo | null } = {
  user: null,
}

vi.mock('../../src/auth/useAuth', () => ({
  useAuth: (): Pick<AuthContextValue, 'user' | 'login'> => ({
    user: authState.user,
    login: loginMock,
  }),
}))

const user: UserInfo = {
  userId: 'user-1',
  email: 'user@example.com',
  name: 'Gold Fish',
  role: 'User',
  token: 'token-1',
}

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function renderLogin(from = '/') {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: { pathname: from } } }]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<LocationDisplay />} />
        <Route path="/operations" element={<LocationDisplay />} />
        <Route path="/forgot-password" element={<p>Forgot password page</p>} />
        <Route path="/register" element={<p>Register page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: password },
  })
  await userEvent.click(screen.getByRole('button', { name: 'Login' }))
}

describe('Login', () => {
  beforeEach(() => {
    authState.user = null
    loginMock.mockReset()
    demoState.password = 'secret1'
    vi.useRealTimers()
  })

  it('renders the login form and related links', () => {
    renderLogin()

    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.getByTestId('login-heading')).toHaveTextContent('Login')
    expect(screen.getByTestId('login-form')).toBeInTheDocument()
    expect(screen.getByTestId('login-email')).toBeInTheDocument()
    expect(screen.getByTestId('login-password')).toBeInTheDocument()
    expect(screen.getByTestId('login-submit')).toHaveTextContent('Login')
    expect(screen.getByTestId('login-forgot-password')).toHaveAttribute(
      'href',
      '/forgot-password',
    )
    expect(screen.getByTestId('login-sign-up')).toHaveAttribute('href', '/register')
    expect(screen.getByTestId('login-demo')).toHaveTextContent('Login with demo user')
    expect(screen.getByTestId('login-blazor')).toHaveAttribute('href', blazorUiUrl)
    expect(screen.getByTestId('login-blazor')).toHaveAttribute('target', '_blank')
    expect(screen.getByTestId('login-github')).toHaveAttribute('href', githubUrl)
    expect(screen.getByTestId('login-github')).toHaveAttribute('target', '_blank')
  })

  it('redirects an already authenticated user away from login', () => {
    authState.user = user
    renderLogin('/operations')

    expect(screen.getByTestId('location')).toHaveTextContent('/operations')
    expect(screen.queryByRole('heading', { name: 'Login' })).not.toBeInTheDocument()
  })

  it('requires email and password before calling login', async () => {
    renderLogin()

    await userEvent.click(screen.getByRole('button', { name: 'Login' }))

    expect(screen.getByTestId('login-email-error')).toHaveTextContent('Email is required')
    expect(screen.getByTestId('login-password-error')).toHaveTextContent(
      'Password is required',
    )
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid email and a short password', async () => {
    renderLogin()

    await fillAndSubmit('not-an-email', '123')

    expect(screen.getByTestId('login-email-error')).toHaveTextContent(
      'Enter a valid email address',
    )
    expect(screen.getByTestId('login-password-error')).toHaveTextContent(
      'Password must be at least 6 characters',
    )
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('trims the email and signs in with valid credentials', async () => {
    loginMock.mockResolvedValue({
      success: true,
      message: 'Success',
      user,
    })

    renderLogin('/operations')
    await fillAndSubmit('  user@example.com  ', 'secret1')

    expect(loginMock).toHaveBeenCalledWith('user@example.com', 'secret1')
    expect(await screen.findByTestId('location')).toHaveTextContent('/operations')
  })

  it('shows the API message when credentials are rejected', async () => {
    loginMock.mockResolvedValue({
      success: false,
      message: 'Invalid email or password.',
    })

    renderLogin()
    await fillAndSubmit('user@example.com', 'secret1')

    expect(await screen.findByTestId('login-form-error')).toHaveTextContent(
      'Invalid email or password.',
    )
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })

  it('falls back to Invalid credentials when the API omits a message', async () => {
    loginMock.mockResolvedValue({
      success: false,
      message: '',
    })

    renderLogin()
    await fillAndSubmit('user@example.com', 'secret1')

    expect(await screen.findByTestId('login-form-error')).toHaveTextContent(
      'Invalid credentials',
    )
  })

  it('fills demo credentials, pauses, then signs in', async () => {
    loginMock.mockResolvedValue({
      success: true,
      message: 'Success',
      user,
    })

    vi.useFakeTimers()
    renderLogin('/operations')

    fireEvent.click(screen.getByRole('button', { name: 'Login with demo user' }))

    expect(screen.getByLabelText('Email')).toHaveValue('demo@goldfish.app')
    expect(screen.getByLabelText('Password')).toHaveValue('secret1')
    expect(screen.getByTestId('login-demo-status')).toHaveTextContent('Demo credentials loaded')
    expect(loginMock).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200)
    })

    expect(loginMock).toHaveBeenCalledWith('demo@goldfish.app', 'secret1')
    expect(screen.getByTestId('location')).toHaveTextContent('/operations')
  })

  it('does not submit demo login when the password is not configured', async () => {
    demoState.password = ''
    renderLogin()

    await userEvent.click(screen.getByRole('button', { name: 'Login with demo user' }))

    expect(screen.getByTestId('login-form-error')).toHaveTextContent(
      'Demo login is not configured.',
    )
    expect(loginMock).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Email')).toHaveValue('')
  })
})
