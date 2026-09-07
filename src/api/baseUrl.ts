export function apiUrl(path: string) {
  const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
  if (base) {
    return `${base}${path}`
  }

  // Vercel reserves /api for serverless functions, so production uses a rewrite prefix.
  if (import.meta.env.PROD) {
    return `/sfmb-proxy${path}`
  }

  return path
}
