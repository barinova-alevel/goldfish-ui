import { beforeEach, describe, expect, it, vi } from 'vitest'
import { register } from '../../src/auth/authService'
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

describe('register', () => {
  beforeEach(() => {
    postJsonMock.mockReset()
  })

  it('posts email, password, and a split name to /api/auth/register', async () => {
    postJsonMock.mockResolvedValue(
      jsonResponse(200, {
        token: 'a.b.c',
        email: 'user@example.com',
        userId: 'user-1',
        role: 'User',
      }),
    )

    await register({
      name: '  Gold  Fish  ',
      email: 'user@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
    })

    expect(postJsonMock).toHaveBeenCalledWith('/api/auth/register', {
      email: 'user@example.com',
      password: 'secret1',
      firstName: 'Gold',
      lastName: 'Fish',
    })
  })

  it('treats extra name parts as the last name', async () => {
    postJsonMock.mockResolvedValue(
      jsonResponse(200, {
        token: 'a.b.c',
        email: 'user@example.com',
        userId: 'user-1',
      }),
    )

    await register({
      name: 'Gold Fish Tank',
      email: 'user@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
    })

    expect(postJsonMock).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({
        firstName: 'Gold',
        lastName: 'Fish Tank',
      }),
    )
  })

  it('sends an empty last name when only one name part is given', async () => {
    postJsonMock.mockResolvedValue(
      jsonResponse(200, {
        token: 'a.b.c',
        email: 'user@example.com',
        userId: 'user-1',
      }),
    )

    await register({
      name: 'Gold',
      email: 'user@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
    })

    expect(postJsonMock).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({
        firstName: 'Gold',
        lastName: '',
      }),
    )
  })

  it('returns the user when the API succeeds', async () => {
    postJsonMock.mockResolvedValue(
      jsonResponse(200, {
        token: 'a.b.c',
        email: 'user@example.com',
        userId: 'user-1',
        role: 'User',
      }),
    )

    const response = await register({
      name: 'Gold Fish',
      email: 'user@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
    })

    expect(response).toEqual({
      success: true,
      message: 'Success',
      user: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'user@example.com',
        role: 'User',
        token: 'a.b.c',
      },
    })
  })

  it('maps API error bodies to a failed registration', async () => {
    postJsonMock.mockResolvedValue(
      jsonResponse(400, { message: 'Email already registered' }),
    )

    const response = await register({
      name: 'Gold Fish',
      email: 'user@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
    })

    expect(response).toEqual({
      success: false,
      message: 'Email already registered',
    })
  })

  it('maps 500 and 503 responses to a temporary outage message', async () => {
    postJsonMock.mockResolvedValue(jsonResponse(503, { message: 'down' }))

    await expect(
      register({
        name: 'Gold Fish',
        email: 'user@example.com',
        password: 'secret1',
        confirmPassword: 'secret1',
      }),
    ).resolves.toEqual({
      success: false,
      message: 'The service is temporarily unavailable. Please try again later.',
    })
  })

  it('maps network failures to a reachability error', async () => {
    postJsonMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const response = await register({
      name: 'Gold Fish',
      email: 'user@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
    })

    expect(response).toEqual({
      success: false,
      message: 'Unable to reach the server. Please try again.',
    })
  })

  it('treats a successful HTTP response without a user payload as a failure', async () => {
    postJsonMock.mockResolvedValue(jsonResponse(200, { message: 'No token' }))

    const response = await register({
      name: 'Gold Fish',
      email: 'user@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
    })

    expect(response.success).toBe(false)
    expect(response.message).toBe('No token')
  })
})
