import type { UserInfo } from './types'

const USER_SESSION_KEY = 'sfmb.user'

export function readStoredUser(): UserInfo | null {
  try {
    const raw = sessionStorage.getItem(USER_SESSION_KEY)
    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    const record = parsed as Record<string, unknown>
    if (
      typeof record.userId !== 'string' ||
      typeof record.email !== 'string' ||
      typeof record.name !== 'string'
    ) {
      return null
    }

    return {
      userId: record.userId,
      email: record.email,
      name: record.name,
      token: typeof record.token === 'string' ? record.token : '',
    }
  } catch {
    return null
  }
}

export function writeStoredUser(user: UserInfo) {
  sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user))
}

export function clearStoredUser() {
  sessionStorage.removeItem(USER_SESSION_KEY)
}
