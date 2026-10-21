import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, Check, Copy, FileText, User } from 'lucide-react'
import { notify } from '../../lib/notify'
import type { ChatMessageView, Citation } from '../../types/chat'

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setDone(true)
      setTimeout(() => setDone(false), 1500)
    } catch {
      notify.error('copy to the clipboard', 'your browser blocked access')
    }
  }
  return (
    <button
      onClick={() => void copy()}
      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200"
      aria-label={done ? 'Copied' : 'Copy answer'}
    >
      {done ? <Check size={15} className="text-emerald-600" aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
    </button>
  )
}

function Citations({ items }: { items?: Citation[] }) {
  const seen = new Set<string>()
  const unique = (items ?? []).filter((c) => {
    const key = `${c.documentId}-${c.chunkIndex}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  if (!unique.length) return null
  return (
    <ul role="list" aria-label="Sources" className="mt-3 flex flex-wrap gap-2">
      {unique.map((c) => (
        <li
          key={`${c.documentId}-${c.chunkIndex}`}
          title={c.snippet}
          className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white/60 px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
        >
          <FileText size={12} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{c.fileName}</span>
          <span className="shrink-0 text-slate-600 dark:text-slate-400">#{c.chunkIndex ?? '?'}{c.pageNumber != null && ` • p${c.pageNumber}`}</span>
        </li>
      ))}
    </ul>
  )
}

const enter = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 } }

interface Props {
  message: ChatMessageView
  /** old messages skip layout and paint until scrolled near (a cheap alternative to virtualising) */
  deferred?: boolean
}

function MessageBubble({ message: m, deferred }: Props) {
  const defer = deferred ? 'cv-auto' : undefined
  if (m.messageType === 'USER') {
    return (
      <motion.div {...enter} className={clsx('flex justify-end gap-2 sm:gap-3', defer)}>
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl bg-brand-strong px-4 py-3 text-[15px] text-white sm:max-w-[80%] sm:px-6 sm:py-4">{m.content}</div>
        <span className="mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600 sm:flex dark:bg-slate-800 dark:text-slate-300" aria-hidden="true"><User size={17} /></span>
      </motion.div>
    )
  }
  return (
    <motion.div {...enter} className={clsx('flex gap-2 sm:gap-3', defer)}>
      <span className="mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-strong text-white sm:flex" aria-hidden="true"><Bot size={18} /></span>
      <div className="min-w-0 max-w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:max-w-[85%] sm:px-6 sm:py-4 dark:border-slate-800 dark:bg-[#0e1426] dark:shadow-none">
        {m.error ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">{m.error}</p>
        ) : (
          <div className={clsx('md break-words text-[15px]', m.pending && 'caret')}>
            {m.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
            ) : m.pending ? (
              <span className="text-slate-600 dark:text-slate-400">Thinking…</span>
            ) : null}
          </div>
        )}
        {!m.pending && !m.error && (
          <>
            <Citations items={m.citations} />
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-800">
              <span className="text-xs text-slate-600 dark:text-slate-400">{m.responseTimeMs != null && `${(m.responseTimeMs / 1000).toFixed(1)}s`}</span>
              <CopyButton text={m.content} />
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

// Changed messages are replaced, not mutated, so memo skips every bubble except the one streaming;
// otherwise each token re-parsed the Markdown of the whole conversation.
export default memo(MessageBubble)
