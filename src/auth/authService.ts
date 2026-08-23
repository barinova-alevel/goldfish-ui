import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  UserInfo,
} from './types'

const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''

function parseUser(value: unknown): UserInfo | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const record = value as Record<string, unknown>
  if (
    typeof record.userId !== 'string' ||
    typeof record.email !== 'string' ||
    typeof record.name !== 'string'
  ) {
    return undefined
  }

  return {
    userId: record.userId,
    email: record.email,
    name: record.name,
    token: typeof record.token === 'string' ? record.token : '',
  }
}

async function readAuthResponse(response: Response): Promise<AuthResponse> {
  const data: unknown = await response.json().catch(() => null)

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    const message =
      typeof record.message === 'string'
        ? record.message
        : response.ok
          ? 'Success'
          : 'Request failed'

    return {
      success: Boolean(record.success),
      message,
      user: parseUser(record.user),
    }
  }

  return {
    success: false,
    message: response.ok
      ? 'Unexpected server response'
      : `Request failed (${response.status})`,
  }
}

async function postAuth(path: string, body: unknown): Promise<AuthResponse> {
  try {
    const response = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    return await readAuthResponse(response)
  } catch {
    return {
      success: false,
      message: 'Unable to reach the server. Please try again.',
    }
  }
}

export function login(request: LoginRequest): Promise<AuthResponse> {
  return postAuth('/api/auth/login', request)
}

export function register(request: RegisterRequest): Promise<AuthResponse> {
  return postAuth('/api/auth/register', request)
}

export function forgotPassword(request: ForgotPasswordRequest): Promise<AuthResponse> {
  return postAuth('/api/auth/forgot-password', request)
}
