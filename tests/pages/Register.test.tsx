import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Register } from '../../src/pages/Register'
import type { AuthContextValue } from '../../src/auth/context'
import type { UserInfo } from '../../src/auth/types'

const registerMock = vi.fn()

const authState: { user: UserInfo | null } = {
  user: null,
}

vi.mock('../../src/auth/useAuth', () => ({
  useAuth: (): Pick<AuthContextValue, 'user' | 'register'> => ({
    user: authState.user,
    register: registerMock,
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

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<LocationDisplay />} />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(fields: {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}) {
  if (fields.name !== undefined) {
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: fields.name },
    })
  }
  if (fields.email !== undefined) {
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: fields.email },
    })
  }
  if (fields.password !== undefined) {
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: fields.password },
    })
  }
  if (fields.confirmPassword !== undefined) {
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: fields.confirmPassword },
    })
  }
  await userEvent.click(screen.getByRole('button', { name: 'Create Account' }))
}

describe('Register', () => {
  beforeEach(() => {
    authState.user = null
    registerMock.mockReset()
  })

  it('renders the sign up form and a link to login', () => {
    renderRegister()

    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('redirects an already authenticated user to home', () => {
    authState.user = user
    renderRegister()

    expect(screen.getByTestId('location')).toHaveTextContent('/')
    expect(
      screen.queryByRole('heading', { name: 'Sign Up' }),
    ).not.toBeInTheDocument()
  })

  it('requires name, email, password, and confirmation before calling register', async () => {
    renderRegister()

    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(screen.getByText('Confirm your password')).toBeInTheDocument()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid email and a short password', async () => {
    renderRegister()

    await fillAndSubmit({
      name: 'Gold Fish',
      email: 'not-an-email',
      password: '123',
      confirmPassword: '123',
    })

    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument()
    expect(
      screen.getByText('Password must be at least 6 characters'),
    ).toBeInTheDocument()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('rejects a confirmation that does not match the password', async () => {
    renderRegister()

    await fillAndSubmit({
      name: 'Gold Fish',
      email: 'user@example.com',
      password: 'secret1',
      confirmPassword: 'secret2',
    })

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('trims name and email and registers with matching passwords', async () => {
    registerMock.mockResolvedValue({
      success: true,
      message: 'Success',
      user,
    })

    renderRegister()
    await fillAndSubmit({
      name: '  Gold Fish  ',
      email: '  user@example.com  ',
      password: 'secret1',
      confirmPassword: 'secret1',
    })

    expect(registerMock).toHaveBeenCalledWith({
      name: 'Gold Fish',
      email: 'user@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
    })
    expect(await screen.findByTestId('location')).toHaveTextContent('/')
  })

  it('shows the API message when registration is rejected', async () => {
    registerMock.mockResolvedValue({
      success: false,
      message: 'Email already registered',
    })

    renderRegister()
    await fillAndSubmit({
      name: 'Gold Fish',
      email: 'user@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
    })

    expect(
      await screen.findByText('Email already registered'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument()
  })

  it('falls back to Registration failed when the API omits a message', async () => {
    registerMock.mockResolvedValue({
      success: false,
      message: '',
    })

    renderRegister()
    await fillAndSubmit({
      name: 'Gold Fish',
      email: 'user@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
    })

    expect(await screen.findByText('Registration failed')).toBeInTheDocument()
  })
})
