import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { notify } from '../../lib/notify'
import { CheckCircle2, ChevronDown, CircleAlert, FileText, Layers, Loader2, MessageSquare, Trash2 } from 'lucide-react'
import { formatDate, formatSize } from '../../lib/utils'
import { toApiError } from '../../services/http'
import { useAppStore } from '../../store/appStore'
import { useChatStore } from '../../store/chatStore'
import type { DocumentMetadata, DocumentStatus } from '../../types/document'

const status: Record<DocumentStatus, { label: string; cls: string; Icon: typeof CheckCircle2; spin?: boolean }> = {
  INDEXED: { label: 'Indexed', cls: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400', Icon: CheckCircle2 },
  PROCESSING: { label: 'Processing', cls: 'bg-amber-500/10 text-amber-800 dark:text-amber-400', Icon: Loader2, spin: true },
  UPLOADING: { label: 'Uploading', cls: 'bg-amber-500/10 text-amber-800 dark:text-amber-400', Icon: Loader2, spin: true },
  FAILED: { label: 'Failed', cls: 'bg-red-500/10 text-red-800 dark:text-red-400', Icon: CircleAlert },
}

interface Props {
  doc: DocumentMetadata
  selected: boolean
  onNavigate: () => void
}

/** One document in the sidebar: click = use as scope, chevron = details, trash = delete. */
export default function DocumentCard({ doc, selected, onNavigate }: Props) {
  const navigate = useNavigate()
  const selectDocument = useAppStore((s) => s.selectDocument)
  const removeDocument = useAppStore((s) => s.removeDocument)
  const startNewChat = useChatStore((s) => s.startNewChat)
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const s = status[doc.status] ?? status.FAILED
  const isPdf = doc.filename.toLowerCase().endsWith('.pdf')

  const remove = async () => {
    setDeleting(true)
    try {
      await removeDocument(doc.id)
      notify.success(`${doc.filename} deleted`)
    } catch (err) {
      notify.error(`delete ${doc.filename}`, toApiError(err).message)
      setDeleting(false)
      setConfirming(false)
    }
  }

  const viewChunks = () => {
    selectDocument(doc.id)
    navigate('/chunks')
    onNavigate()
  }

  const chat = () => {
    selectDocument(doc.id)
    startNewChat()
    navigate('/')
    onNavigate()
  }

  const stop = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      onClick={() => selectDocument(selected ? null : doc.id)}
      className={clsx(
        'cursor-pointer rounded-xl border p-3 transition-colors',
        selected
          ? 'border-brand/60 bg-brand/10'
          : 'border-slate-200 bg-slate-50/60 hover:border-brand/40 dark:border-slate-800 dark:bg-slate-900/40',
      )}
      title={selected ? 'Click to clear this scope' : 'Click to use as scope'}
    >
      <div className="flex items-start gap-3">
        <span className={clsx('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', isPdf ? 'bg-red-500/10 text-red-500' : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>
          <FileText size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold" title={doc.filename}>{doc.filename}</span>
            <button
              onClick={(e) => { stop(e); setExpanded((v) => !v) }}
              className="rounded-md p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-700/50 dark:hover:text-slate-200"
              aria-label={expanded ? 'Hide details' : 'Show details'}
              aria-expanded={expanded}
            >
              <ChevronDown size={15} className={clsx('transition', expanded && 'rotate-180')} />
            </button>
            <button
              onClick={(e) => { stop(e); setConfirming(true) }}
              className="rounded-md p-1 text-slate-500 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-600"
              aria-label={`Delete ${doc.filename}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold', s.cls)}>
              <s.Icon size={12} className={s.spin ? 'animate-spin' : ''} /> {s.label}
            </span>
            <span className="text-slate-600 dark:text-slate-400">{formatSize(doc.fileSize)}</span>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {confirming && (
          <motion.div
            key="confirm"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onClick={stop}
          >
            <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs">
              <span className="text-red-800 dark:text-red-400">Delete document and its vectors?</span>
              <span className="flex gap-1.5">
                <button onClick={() => void remove()} disabled={deleting} className="rounded-md bg-red-600 px-2.5 py-1 font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                  {deleting ? '…' : 'Delete'}
                </button>
                <button autoFocus onClick={() => setConfirming(false)} className="rounded-md border border-slate-400 px-2.5 py-1 font-medium dark:border-slate-600">No</button>
              </span>
            </div>
          </motion.div>
        )}
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onClick={stop}
          >
            <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 text-xs dark:border-slate-800">
              <div><dt className="text-slate-600 dark:text-slate-400">Pages</dt><dd className="mt-0.5 font-semibold">{doc.totalPages ?? 0}</dd></div>
              <div><dt className="text-slate-600 dark:text-slate-400">Chunks</dt><dd className="mt-0.5 font-semibold">{doc.totalChunks ?? 0}</dd></div>
              <div><dt className="text-slate-600 dark:text-slate-400">Uploaded</dt><dd className="mt-0.5 font-semibold">{formatDate(doc.createdAt)}</dd></div>
            </dl>
            {doc.errorMessage && <p className="mt-2 rounded-md bg-red-500/10 px-2 py-1.5 text-xs text-red-800 dark:text-red-400">{doc.errorMessage}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={viewChunks} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium hover:border-brand hover:text-brand dark:border-slate-700">
                <Layers size={13} /> View chunks
              </button>
              <button onClick={chat} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-strong px-2 py-1.5 text-xs font-semibold text-white hover:brightness-110">
                <MessageSquare size={13} /> Chat
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
