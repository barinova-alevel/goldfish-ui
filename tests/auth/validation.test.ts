import { describe, expect, it } from 'vitest'
import { isValidEmail, minPasswordLength } from '../../src/auth/validation'

describe('isValidEmail', () => {
  it('accepts a typical email address', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
  })

  it('trims surrounding whitespace before validating', () => {
    expect(isValidEmail('  user@example.com  ')).toBe(true)
  })

  it('rejects empty and malformed addresses', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('user@example')).toBe(false)
    expect(isValidEmail('not-an-email')).toBe(false)
  })
})

describe('minPasswordLength', () => {
  it('requires at least 6 characters', () => {
    expect(minPasswordLength).toBe(6)
  })
})
