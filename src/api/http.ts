import { apiUrl } from './baseUrl'

interface RequestJsonOptions {
  method?: string
  body?: unknown
  token?: string
}

export function requestJson(path: string, options: RequestJsonOptions = {}) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  return fetch(apiUrl(path), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
}

export function postJson(path: string, body: unknown) {
  return requestJson(path, { method: 'POST', body })
}

export async function readJsonBody(response: Response): Promise<unknown> {
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

export function messageFromBody(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of ['message', 'Message', 'detail', 'title']) {
      const item = record[key]
      if (typeof item === 'string' && item.trim()) {
        return item.trim()
      }
    }
  }

  return fallback
}
