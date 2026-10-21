import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import BrandMark from '../../components/ui/BrandMark'
import { useAuthStore } from '../../store/authStore'

/** Card shared by /login and /register; signed-in users are sent to the app. */
export default function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  const signedIn = useAuthStore((s) => !!s.session?.token)
  if (signedIn) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-full items-center justify-center bg-[radial-gradient(ellipse_at_top,#dcece9_0%,var(--color-canvas)_55%)] p-4 text-slate-900 dark:bg-[#060a16] dark:bg-none dark:text-slate-100">
      <main className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-7 dark:border-slate-800 dark:bg-[#0d1426] dark:shadow-2xl dark:shadow-black/40">
        <div className="mb-6 flex items-center gap-3">
          <BrandMark size="md" />
          <div>
            <div className="text-xl font-semibold text-brand">DocMind</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Spring AI • PostgreSQL pgvector</div>
          </div>
        </div>
        <h1 className="mb-5 text-lg font-semibold">{title}</h1>
        {children}
      </main>
    </div>
  )
}
