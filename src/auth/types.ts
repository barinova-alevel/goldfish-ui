export interface UserInfo {
  userId: string
  email: string
  name: string
  role: string
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  confirmPassword: string
  name: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: UserInfo
}
