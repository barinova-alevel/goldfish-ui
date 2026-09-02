const NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'

export function displayNameFromToken(token: string, fallback: string) {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) {
      return fallback
    }

    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>
    const claimName = payload[NAME_CLAIM]
    if (typeof claimName === 'string' && claimName.trim()) {
      return claimName.trim()
    }

    if (typeof payload.name === 'string' && payload.name.trim()) {
      return payload.name.trim()
    }

    return fallback
  } catch {
    return fallback
  }
}
