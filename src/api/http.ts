import { apiUrl } from './baseUrl'

export function postJson(path: string, body: unknown) {
  return fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}
