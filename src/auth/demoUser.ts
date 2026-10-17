export const demoEmail = 'demo@goldfish.app'

/** Pause so the filled email and masked password are visible before submit. */
export const demoLoginDelayMs = 1200

export const blazorUiUrl = 'https://goldfish-app-j6a9p.ondigitalocean.app'

export const githubUrl = 'https://github.com/barinova-alevel/goldfish-ui'

export function demoPassword() {
  const value = import.meta.env.VITE_DEMO_PASSWORD
  return typeof value === 'string' ? value.trim() : ''
}
