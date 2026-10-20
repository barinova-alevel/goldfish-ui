import { readJsonBody, requestJson } from '../api/http'

/** Pause so the filled email and masked password are visible before submit. */
export const demoLoginDelayMs = 1200

export const blazorUiUrl = 'https://goldfish-app-j6a9p.ondigitalocean.app'

export const githubUrl = 'https://github.com/barinova-alevel/goldfish-ui'

function readString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

/** Loads demo credentials from the API. The password is not stored in this UI. */
export async function loadDemoCredentials(): Promise<{ email: string; password: string } | null> {
  try {
    const response = await requestJson('/api/auth/demo')
    if (!response.ok) {
      return null
    }

    const body = await readJsonBody(response)
    if (!body || typeof body !== 'object') {
      return null
    }

    const record = body as Record<string, unknown>
    const email = readString(record, 'email', 'Email')
    const password = readString(record, 'password', 'Password')
    if (!email || !password) {
      return null
    }

    return { email, password }
  } catch {
    return null
  }
}
