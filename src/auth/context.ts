import { createContext } from 'react'
import type { AuthResponse, RegisterRequest, UserInfo } from './types'

export interface AuthContextValue {
  user: UserInfo | null
  login: (email: string, password: string) => Promise<AuthResponse>
  register: (request: RegisterRequest) => Promise<AuthResponse>
  forgotPassword: (email: string) => Promise<AuthResponse>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
