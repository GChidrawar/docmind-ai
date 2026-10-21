import { publicHttp, request } from './http'
import type { AuthSession, User } from '../types/auth'

export const authApi = {
  login: (userName: string, password: string) =>
    request<AuthSession>({ method: 'POST', url: '/auth/login', data: { userName, password } }, publicHttp),

  register: (userName: string, email: string, password: string) =>
    request<User>({ method: 'POST', url: '/auth/register', data: { userName, email, password } }, publicHttp),
}
