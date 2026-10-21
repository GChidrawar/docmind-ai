import { create } from 'zustand'

// index.html applies the saved theme before first paint using this same key.
const KEY = 'docmind.theme'
// Browser UI colour (mobile address bar); matches each theme's header.
const THEME_COLOR = { dark: '#0a1020', light: '#ffffff' } as const

interface ThemeState {
  dark: boolean
  toggle: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  dark: document.documentElement.classList.contains('dark'),
  toggle: () => {
    const next = !get().dark
    document.documentElement.classList.toggle('dark', next)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[next ? 'dark' : 'light'])
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light')
    } catch {
      /* storage unavailable */
    }
    set({ dark: next })
  },
}))
