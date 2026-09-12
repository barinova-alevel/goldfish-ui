import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Login } from '../../src/pages/Login'
import type { AuthContextValue } from '../../src/auth/context'
import type { UserInfo } from '../../src/auth/types'

const loginMock = vi.fn()

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
  })

  it('renders the login form and related links', () => {
    renderLogin()

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Forgot Password/ })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
    expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute(
      'href',
      '/register',
    )
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

    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid email and a short password', async () => {
    renderLogin()

    await fillAndSubmit('not-an-email', '123')

    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument()
    expect(
      screen.getByText('Password must be at least 6 characters'),
    ).toBeInTheDocument()
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

    expect(
      await screen.findByText('Invalid email or password.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })

  it('falls back to Invalid credentials when the API omits a message', async () => {
    loginMock.mockResolvedValue({
      success: false,
      message: '',
    })

    renderLogin()
    await fillAndSubmit('user@example.com', 'secret1')

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
  })
})
