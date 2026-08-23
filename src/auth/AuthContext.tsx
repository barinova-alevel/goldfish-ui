import { useMemo, useState, type ReactNode } from 'react'
import * as authService from './authService'
import { AuthContext, type AuthContextValue } from './context'
import { clearStoredUser, readStoredUser, writeStoredUser } from './storage'
import type { UserInfo } from './types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(() => readStoredUser())

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      async login(email, password) {
        const response = await authService.login({ email, password })
        if (response.success && response.user) {
          writeStoredUser(response.user)
          setUser(response.user)
        }
        return response
      },
      async register(request) {
        const response = await authService.register(request)
        if (response.success && response.user) {
          writeStoredUser(response.user)
          setUser(response.user)
        }
        return response
      },
      async forgotPassword(email) {
        return authService.forgotPassword({ email })
      },
      logout() {
        clearStoredUser()
        setUser(null)
      },
    }
  }, [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
