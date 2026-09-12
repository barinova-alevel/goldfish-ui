import { beforeEach, describe, expect, it, vi } from 'vitest'
import { login } from '../../src/auth/authService'
import { postJson } from '../../src/api/http'

vi.mock('../../src/api/http', () => ({
  postJson: vi.fn(),
}))

const postJsonMock = vi.mocked(postJson)

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('login', () => {
  beforeEach(() => {
    postJsonMock.mockReset()
  })

  it('posts credentials to /api/auth/login', async () => {
    postJsonMock.mockResolvedValue(
      jsonResponse(200, {
        token: 'a.b.c',
        email: 'user@example.com',
        userId: 'user-1',
        role: 'User',
      }),
    )

    await login({ email: 'user@example.com', password: 'secret1' })

    expect(postJsonMock).toHaveBeenCalledWith('/api/auth/login', {
      email: 'user@example.com',
      password: 'secret1',
    })
  })

  it('returns the user when the API succeeds', async () => {
    postJsonMock.mockResolvedValue(
      jsonResponse(200, {
        token: 'a.b.c',
        email: 'user@example.com',
        userId: 'user-1',
        role: 'Admin',
      }),
    )

    const response = await login({
      email: 'user@example.com',
      password: 'secret1',
    })

    expect(response).toEqual({
      success: true,
      message: 'Success',
      user: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'user@example.com',
        role: 'Admin',
        token: 'a.b.c',
      },
    })
  })

  it('maps 401 responses to invalid credentials', async () => {
    postJsonMock.mockResolvedValue(
      jsonResponse(401, { message: 'Wrong password' }),
    )

    const response = await login({
      email: 'user@example.com',
      password: 'nope',
    })

    expect(response).toEqual({
      success: false,
      message: 'Wrong password',
    })
  })

  it('uses a default 401 message when the body has none', async () => {
    postJsonMock.mockResolvedValue(jsonResponse(401, {}))

    const response = await login({
      email: 'user@example.com',
      password: 'nope',
    })

    expect(response.message).toBe('Invalid email or password.')
    expect(response.success).toBe(false)
  })

  it('maps 500 and 503 responses to a temporary outage message', async () => {
    postJsonMock.mockResolvedValue(jsonResponse(503, { message: 'down' }))

    await expect(
      login({ email: 'user@example.com', password: 'secret1' }),
    ).resolves.toEqual({
      success: false,
      message: 'The service is temporarily unavailable. Please try again later.',
    })

    postJsonMock.mockResolvedValue(jsonResponse(500, {}))

    await expect(
      login({ email: 'user@example.com', password: 'secret1' }),
    ).resolves.toEqual({
      success: false,
      message: 'The service is temporarily unavailable. Please try again later.',
    })
  })

  it('maps network failures to a reachability error', async () => {
    postJsonMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const response = await login({
      email: 'user@example.com',
      password: 'secret1',
    })

    expect(response).toEqual({
      success: false,
      message: 'Unable to reach the server. Please try again.',
    })
  })

  it('treats a successful HTTP response without a user payload as a failure', async () => {
    postJsonMock.mockResolvedValue(jsonResponse(200, { message: 'No token' }))

    const response = await login({
      email: 'user@example.com',
      password: 'secret1',
    })

    expect(response.success).toBe(false)
    expect(response.message).toBe('No token')
  })
})
