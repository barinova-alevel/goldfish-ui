const API_ORIGIN = 'https://goldfish-app-j6a9p.ondigitalocean.app'

export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  const url = new URL(request.url)
  const pathAfterApi = url.pathname.replace(/^\/api/, '')
  const target = `${API_ORIGIN}/api/api${pathAfterApi}${url.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')

  const method = request.method.toUpperCase()
  const init = {
    method,
    headers,
    redirect: 'manual',
  }

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = request.body
  }

  return fetch(target, init)
}
