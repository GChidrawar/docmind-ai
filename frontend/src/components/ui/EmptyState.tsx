import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  hint?: string
  action?: React.ReactNode
}

/** Icon, title, hint and optional action; used for empty lists. */
export default function EmptyState({ icon: Icon, title, hint, action }: Props) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-400">
        <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      {hint && <p className="mt-1.5 max-w-[220px] text-xs leading-relaxed text-slate-600 dark:text-slate-400">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
