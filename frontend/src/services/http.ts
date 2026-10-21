import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type { ApiEnvelope } from '../types/api'
import type { AuthSession } from '../types/auth'

// The backend's context path is /docmind, so its API is /docmind/api/v1.
export const API_BASE = import.meta.env.VITE_API_BASE ?? '/docmind/api/v1'
export const SWAGGER_URL = import.meta.env.VITE_SWAGGER_URL ?? 'http://localhost:9090/docmind/swagger-ui/index.html'

/** Error thrown by every service call; `message` is safe to show to the user. */
export class ApiError extends Error {
  readonly status: number
  readonly data?: unknown
  constructor(message: string, status = 0, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/** The auth store registers here, so this module never imports it (avoids a circular import). */
interface AuthBinding {
  getSession: () => AuthSession | null
  setSession: (session: AuthSession) => void
  logout: () => void
}
let auth: AuthBinding = { getSession: () => null, setSession: () => {}, logout: () => {} }
export const bindAuth = (binding: AuthBinding) => { auth = binding }

/** Authenticated client: adds the bearer token and refreshes it once on 401. */
export const http = axios.create({ baseURL: API_BASE })
/** Client without interceptors, for the public auth endpoints. */
export const publicHttp = axios.create({ baseURL: API_BASE })

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err
  if (axios.isCancel(err)) return new ApiError('Request cancelled', 0)
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as Partial<ApiEnvelope<{ message?: string }>> | undefined
    const message =
      body?.message ??
      body?.data?.message ?? // upload errors carry the reason in data
      (err.response ? `Request failed (${err.response.status})` : 'Cannot reach the server')
    return new ApiError(message, err.response?.status ?? 0, body?.data)
  }
  return new ApiError(err instanceof Error ? err.message : 'Unexpected error')
}

/** Sends a request and unwraps the { success, message, data } envelope. */
export async function request<T>(config: AxiosRequestConfig, client = http): Promise<T> {
  try {
    const res = await client.request<ApiEnvelope<T>>(config)
    return res.data.data
  } catch (err) {
    throw toApiError(err)
  }
}

let refreshing: Promise<AuthSession> | null = null

/** Exchanges the refresh token for new tokens; concurrent callers share one request. */
export function refreshSession(): Promise<AuthSession> {
  const current = auth.getSession()
  if (!current?.refreshToken) return Promise.reject(new ApiError('Session expired', 401))
  refreshing ??= publicHttp
    .post<ApiEnvelope<AuthSession>>('/auth/refresh', { refreshToken: current.refreshToken })
    .then((res) => {
      auth.setSession(res.data.data)
      return res.data.data
    })
    .finally(() => { refreshing = null })
  return refreshing
}

export const forceLogout = () => auth.logout()
export const getAccessToken = () => auth.getSession()?.token

http.interceptors.request.use((config) => {
  const token = auth.getSession()?.token
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    if (error.response?.status !== 401 || !config || config._retried) {
      if (error.response?.status === 401) auth.logout()
      return Promise.reject(error)
    }
    config._retried = true
    try {
      const fresh = await refreshSession()
      config.headers.set('Authorization', `Bearer ${fresh.token}`)
      return http.request(config)
    } catch {
      auth.logout()
      return Promise.reject(new ApiError('Session expired, please sign in again', 401))
    }
  },
)
