import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../services/authApi'
import { bindAuth } from '../services/http'
import type { AuthSession } from '../types/auth'

interface AuthState {
  session: AuthSession | null
  login: (userName: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      login: async (userName, password) => {
        set({ session: await authApi.login(userName, password) })
      },
      logout: () => set({ session: null }),
    }),
    { name: 'docmind.session', partialize: (s) => ({ session: s.session }) },
  ),
)

// Lets the axios layer read, refresh and clear the session without importing this store.
bindAuth({
  getSession: () => useAuthStore.getState().session,
  setSession: (session) => useAuthStore.setState({ session }),
  logout: () => useAuthStore.getState().logout(),
})
