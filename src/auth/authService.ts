import { postJson } from '../api/http'
import { authFailure, messageFromApiBody, userFromApiPayload } from './parseAuthPayload'
import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
} from './types'

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

async function readAuthResponse(response: Response): Promise<AuthResponse> {
  const body = await readBody(response)
  const user = userFromApiPayload(body)

  if (response.ok && user) {
    return {
      success: true,
      message: 'Success',
      user,
    }
  }

  if (response.status === 401) {
    return authFailure(messageFromApiBody(body, 'Invalid email or password.'))
  }

  if (response.status === 503 || response.status === 500) {
    return authFailure('The service is temporarily unavailable. Please try again later.')
  }

  return authFailure(messageFromApiBody(body, 'Request failed'))
}

async function postAuth(path: string, body: unknown): Promise<AuthResponse> {
  try {
    const response = await postJson(path, body)
    return await readAuthResponse(response)
  } catch {
    return authFailure('Unable to reach the server. Please try again.')
  }
}

export function login(request: LoginRequest): Promise<AuthResponse> {
  return postAuth('/api/auth/login', request)
}

export function register(request: RegisterRequest): Promise<AuthResponse> {
  const nameParts = request.name.trim().split(/\s+/)
  const firstName = nameParts[0] ?? ''
  const lastName = nameParts.slice(1).join(' ')

  return postAuth('/api/auth/register', {
    email: request.email,
    password: request.password,
    firstName,
    lastName,
  })
}

export function forgotPassword(request: ForgotPasswordRequest): Promise<AuthResponse> {
  return postAuth('/api/auth/forgot-password', request)
}
