import clsx from 'clsx'

/** A pulsing placeholder block (decorative; the wrappers below announce "loading"). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={clsx('animate-pulse rounded-md bg-slate-200 dark:bg-slate-800', className)} />
}

function Status({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

/** Same size as a DocumentCard, so the list does not jump when data arrives. */
export function DocumentListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Status label="Loading documents…" className="space-y-2.5">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <Skeleton className="h-3.5 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-10" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </Status>
  )
}

export function ChatListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Status label="Loading chats…" className="space-y-1.5">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <Skeleton className="h-4 w-4 shrink-0 rounded" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className={clsx('h-3.5', ['w-4/5', 'w-2/3', 'w-3/4', 'w-1/2', 'w-5/6'][i % 5])} />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </Status>
  )
}

/** Placeholder for a conversation while its history loads. */
export function MessagesSkeleton() {
  return (
    <Status label="Loading conversation…" className="mx-auto max-w-[900px] space-y-7 px-4 py-8 sm:px-6">
      <div className="flex justify-end gap-3">
        <Skeleton className="h-14 w-2/3 max-w-md rounded-3xl" />
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="w-full max-w-xl space-y-2.5 rounded-3xl border border-slate-200 p-5 dark:border-slate-800">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-11/12" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Skeleton className="h-10 w-1/2 max-w-xs rounded-3xl" />
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
      </div>
    </Status>
  )
}
