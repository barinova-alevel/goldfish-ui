import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../src/auth/AuthContext'
import { useAuth } from '../../src/auth/useAuth'
import * as authService from '../../src/auth/authService'
import type { UserInfo } from '../../src/auth/types'

vi.mock('../../src/auth/authService', () => ({
  login: vi.fn(),
  register: vi.fn(),
  forgotPassword: vi.fn(),
}))

const loginMock = vi.mocked(authService.login)

const user: UserInfo = {
  userId: 'user-1',
  email: 'user@example.com',
  name: 'Gold Fish',
  role: 'User',
  token: 'token-1',
}

function LoginProbe() {
  const { user: currentUser, login } = useAuth()

  return (
    <div>
      <p data-testid="user">{currentUser?.email ?? 'anonymous'}</p>
      <button
        type="button"
        onClick={() => {
          void login('user@example.com', 'secret1')
        }}
      >
        Sign in
      </button>
    </div>
  )
}

describe('AuthProvider login', () => {
  beforeEach(() => {
    sessionStorage.clear()
    loginMock.mockReset()
  })

  it('stores the user after a successful login', async () => {
    loginMock.mockResolvedValue({
      success: true,
      message: 'Success',
      user,
    })

    render(
      <AuthProvider>
        <LoginProbe />
      </AuthProvider>,
    )

    expect(screen.getByTestId('user')).toHaveTextContent('anonymous')

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user@example.com')
    })

    expect(sessionStorage.getItem('sfmb.user')).toContain('"userId":"user-1"')
    expect(loginMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret1',
    })
  })

  it('does not persist a user when login fails', async () => {
    loginMock.mockResolvedValue({
      success: false,
      message: 'Invalid email or password.',
    })

    render(
      <AuthProvider>
        <LoginProbe />
      </AuthProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalled()
    })

    expect(screen.getByTestId('user')).toHaveTextContent('anonymous')
    expect(sessionStorage.getItem('sfmb.user')).toBeNull()
  })
})
