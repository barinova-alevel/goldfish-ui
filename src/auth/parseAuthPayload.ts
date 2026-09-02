import { displayNameFromToken } from './displayName'
import type { AuthResponse, UserInfo } from './types'

function readString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return undefined
}

export function userFromApiPayload(value: unknown): UserInfo | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const record = value as Record<string, unknown>
  const token = readString(record, 'token', 'Token')
  const email = readString(record, 'email', 'Email')
  const userId = readString(record, 'userId', 'UserId')

  if (!token || !email || !userId) {
    return undefined
  }

  return {
    userId,
    email,
    name: displayNameFromToken(token, email),
    role: readString(record, 'role', 'Role') ?? 'User',
    token,
  }
}

export function messageFromApiBody(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const message = readString(record, 'message', 'Message', 'detail', 'title')
    if (message) {
      return message
    }
  }

  return fallback
}

export function authFailure(message: string): AuthResponse {
  return { success: false, message }
}
