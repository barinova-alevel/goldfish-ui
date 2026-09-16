import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../src/auth/AuthContext'
import { useAuth } from '../../src/auth/useAuth'
import * as authService from '../../src/auth/authService'
import type { RegisterRequest, UserInfo } from '../../src/auth/types'

vi.mock('../../src/auth/authService', () => ({
  login: vi.fn(),
  register: vi.fn(),
  forgotPassword: vi.fn(),
}))

const registerMock = vi.mocked(authService.register)

const user: UserInfo = {
  userId: 'user-1',
  email: 'user@example.com',
  name: 'Gold Fish',
  role: 'User',
  token: 'token-1',
}

const request: RegisterRequest = {
  name: 'Gold Fish',
  email: 'user@example.com',
  password: 'secret1',
  confirmPassword: 'secret1',
}

function RegisterProbe() {
  const { user: currentUser, register } = useAuth()

  return (
    <div>
      <p data-testid="user">{currentUser?.email ?? 'anonymous'}</p>
      <button
        type="button"
        onClick={() => {
          void register(request)
        }}
      >
        Create account
      </button>
    </div>
  )
}

describe('AuthProvider register', () => {
  beforeEach(() => {
    sessionStorage.clear()
    registerMock.mockReset()
  })

  it('stores the user after a successful registration', async () => {
    registerMock.mockResolvedValue({
      success: true,
      message: 'Success',
      user,
    })

    render(
      <AuthProvider>
        <RegisterProbe />
      </AuthProvider>,
    )

    expect(screen.getByTestId('user')).toHaveTextContent('anonymous')

    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user@example.com')
    })

    expect(sessionStorage.getItem('sfmb.user')).toContain('"userId":"user-1"')
    expect(registerMock).toHaveBeenCalledWith(request)
  })

  it('does not persist a user when registration fails', async () => {
    registerMock.mockResolvedValue({
      success: false,
      message: 'Email already registered',
    })

    render(
      <AuthProvider>
        <RegisterProbe />
      </AuthProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalled()
    })

    expect(screen.getByTestId('user')).toHaveTextContent('anonymous')
    expect(sessionStorage.getItem('sfmb.user')).toBeNull()
  })
})
