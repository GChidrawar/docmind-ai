export type Role = 'USER' | 'ADMIN'

/** UserDto */
export interface User {
  id: number
  userName: string
  role: Role
  email: string
  createdAt?: string
}

/** LoginResponse (also returned by /auth/refresh) */
export interface AuthSession {
  token: string
  refreshToken: string
  tokenType: string
  user: User
}
