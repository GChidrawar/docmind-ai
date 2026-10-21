import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import BrandMark from '../ui/BrandMark'
import { ChevronDown, ExternalLink, Layers, LogOut, MessageSquare, Moon, PanelLeft, Search, Sun, Upload, type LucideIcon } from 'lucide-react'
import { SWAGGER_URL } from '../../services'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'

const views: { to: string; label: string; Icon: LucideIcon; match: (path: string) => boolean }[] = [
  { to: '/', label: 'Chat', Icon: MessageSquare, match: (p) => p === '/' || p.startsWith('/c/') },
  { to: '/search', label: 'Search', Icon: Search, match: (p) => p.startsWith('/search') },
  { to: '/chunks', label: 'Chunks', Icon: Layers, match: (p) => p.startsWith('/chunks') },
]

function UserMenu() {
  const user = useAuthStore((s) => s.session?.user)
  const logout = useAuthStore((s) => s.logout)
  const { dark, toggle } = useThemeStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const name = user?.userName ?? 'user'
  const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pr-2.5 pl-1.5 text-sm transition hover:border-brand/50 dark:border-slate-700/80 dark:bg-slate-900/60"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-strong to-brand-to text-[11px] font-bold text-white">
          {name.slice(0, 2).toUpperCase()}
        </span>
        <span className="hidden max-w-[110px] truncate font-medium sm:block">{name}</span>
        <ChevronDown size={14} className={clsx('text-slate-500 dark:text-slate-400 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-[#0e1426]">
          <div className="border-b border-slate-200 px-3 pt-1.5 pb-2.5 dark:border-slate-800">
            <div className="truncate text-sm font-semibold">{name}</div>
            <div className="truncate text-xs text-slate-600 dark:text-slate-400">{user?.email}</div>
          </div>
          <button role="menuitem" onClick={toggle} className={clsx(item, 'mt-1.5')}>
            {dark ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} />} {dark ? 'Light theme' : 'Dark theme'}
          </button>
          <a role="menuitem" href={SWAGGER_URL} target="_blank" rel="noreferrer" className={item}>
            <ExternalLink size={16} /> Swagger API
          </a>
          <button role="menuitem" onClick={logout} className={clsx(item, 'text-red-600 dark:text-red-400')}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const { pathname } = useLocation()
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const openUpload = useAppStore((s) => s.openUpload)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-4 dark:border-slate-800/80 dark:bg-[#0a1020]">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          aria-expanded={sidebarOpen}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <PanelLeft size={18} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2.5">
          <BrandMark size="sm" />
          <span className="hidden text-[15px] font-semibold sm:block">DocMind</span>
          <span className="hidden rounded-md bg-brand/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-ink dark:text-brand-light sm:block">AI</span>
        </div>
      </div>

      <nav className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700/70 dark:bg-slate-900/60" aria-label="Views">
        {views.map(({ to, label, Icon, match }) => {
          const active = match(pathname)
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'flex min-h-8 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition sm:px-4',
                active
                  ? 'bg-brand-strong text-white shadow-md shadow-brand/30'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
              )}
            >
              <Icon size={15} aria-hidden="true" /> <span className="hidden sm:inline">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-2">
        <button
          onClick={() => openUpload()}
          aria-label="Upload document"
          className="flex min-h-9 items-center gap-2 rounded-xl bg-brand-strong px-3 py-2 text-sm font-semibold text-white shadow-md shadow-brand/30 transition hover:brightness-110 sm:px-4"
        >
          <Upload size={15} aria-hidden="true" /> <span className="hidden sm:inline">Upload</span>
        </button>
        <UserMenu />
      </div>
    </header>
  )
}
