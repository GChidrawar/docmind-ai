import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { Calendar, FileText, HardDrive, Layers, Loader2, MessageSquare, RefreshCw, Search, type LucideIcon } from 'lucide-react'
import { chunkApi } from '../../services/chunkApi'
import { toApiError } from '../../services/http'
import { formatDate, formatSize } from '../../lib/utils'
import { useAppStore } from '../../store/appStore'
import { useChatStore } from '../../store/chatStore'
import type { Citation } from '../../types/chat'
import HighlightedText from '../../components/ui/HighlightedText'

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0e1426] dark:shadow-none">
      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"><Icon size={14} /> {label}</div>
      <div className="mt-1.5 text-lg font-semibold">{value}</div>
    </div>
  )
}

type State =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'done'; chunks: Citation[] }

export default function ChunksPage() {
  const navigate = useNavigate()
  const documents = useAppStore((s) => s.documents)
  const docsLoading = useAppStore((s) => s.documentsLoading)
  const selectedId = useAppStore((s) => s.selectedDocumentId)
  const selectDocument = useAppStore((s) => s.selectDocument)
  const startNewChat = useChatStore((s) => s.startNewChat)
  const doc = documents.find((d) => d.id === selectedId) ?? null

  const [state, setState] = useState<State>({ status: 'loading' })
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const load = useCallback(async () => {
    if (!doc) return
    setState({ status: 'loading' })
    setExpanded(new Set())
    try {
      setState({ status: 'done', chunks: await chunkApi.listForDocument(doc) })
    } catch (err) {
      setState({ status: 'error', error: toApiError(err).message })
    }
  }, [doc])

  // reload when the selected document changes (keyed on id so list refreshes don't refetch)
  const docId = doc?.id
  useEffect(() => {
    setFilter('')
    if (!docId) return
    let cancelled = false
    const current = documents.find((d) => d.id === docId)
    if (!current) return
    setState({ status: 'loading' })
    setExpanded(new Set())
    chunkApi
      .listForDocument(current)
      .then((chunks) => { if (!cancelled) setState({ status: 'done', chunks }) })
      .catch((err) => { if (!cancelled) setState({ status: 'error', error: toApiError(err).message }) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- documents is read once per selection
  }, [docId])

  const visible = useMemo(() => {
    if (state.status !== 'done') return []
    const q = filter.trim().toLowerCase()
    return q ? state.chunks.filter((c) => c.snippet.toLowerCase().includes(q)) : state.chunks
  }, [state, filter])

  const toggle = (index: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (!next.delete(index)) next.add(index)
      return next
    })

  const chat = () => {
    if (!doc) return
    startNewChat()
    navigate('/')
  }

  return (
    <div className="thin-scroll flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/15 text-brand"><Layers size={18} /></span>
            <h1 className="text-lg font-semibold">Document Chunks</h1>
          </div>
          <select
            value={selectedId ?? ''}
            onChange={(e) => selectDocument(e.target.value || null)}
            aria-label="Document"
            className="max-w-[280px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900/60"
          >
            <option value="">Choose a document…</option>
            {documents.map((d) => <option key={d.id} value={d.id}>{d.filename}</option>)}
          </select>
        </div>

        {!doc ? (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700/70 dark:bg-slate-900/60">
              <Layers size={34} strokeWidth={1.5} />
            </span>
            <h2 className="mt-5 text-lg font-semibold">{docsLoading ? 'Loading documents…' : 'Inspect indexed chunks'}</h2>
            <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              {documents.length === 0 && !docsLoading
                ? 'Upload a document first; its vector chunks will appear here.'
                : 'Pick a document above, or click one in the sidebar, to see how it was split into vector chunks.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 flex items-center gap-3">
              <FileText size={18} className="shrink-0 text-slate-500" />
              <h2 className="min-w-0 truncate text-base font-semibold" title={doc.filename}>{doc.filename}</h2>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 font-mono text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{doc.id.slice(0, 8)}…</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat icon={HardDrive} label="File Size" value={formatSize(doc.fileSize)} />
              <Stat icon={Layers} label="Vector Chunks" value={`${doc.totalChunks ?? 0} Chunks`} />
              <Stat icon={FileText} label="Total Pages" value={`${doc.totalPages ?? 0} Pages`} />
              <Stat icon={Calendar} label="Uploaded" value={formatDate(doc.createdAt)} />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter chunk text..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900/60"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => void load()}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:border-brand/50 dark:border-slate-700"
                >
                  <RefreshCw size={14} className={state.status === 'loading' ? 'animate-spin' : ''} /> Reload
                </button>
                <button onClick={chat} className="flex items-center gap-2 rounded-lg bg-brand-strong px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand/30 hover:brightness-110">
                  <MessageSquare size={14} /> Chat with Document
                </button>
              </div>
            </div>

            <div className="mt-4 mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <span>Indexed Vector Chunks</span>
              {state.status === 'done' && (
                <span>
                  {filter ? `${visible.length} of ${state.chunks.length}` : state.chunks.length < (doc.totalChunks ?? 0) ? `Sample (${state.chunks.length} of ${doc.totalChunks})` : `All ${state.chunks.length}`}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {state.status === 'loading' && <div className="flex justify-center py-12 text-brand"><Loader2 className="animate-spin" /></div>}
              {state.status === 'error' && <p className="py-8 text-center text-sm text-red-700 dark:text-red-400">{state.error}</p>}
              {state.status === 'done' && visible.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-600 dark:text-slate-400">{filter ? 'No chunk contains that text.' : 'No chunks available for this document.'}</p>
              )}
              {visible.map((c, i) => {
                const index = c.chunkIndex ?? i
                const filtering = filter.trim() !== ''
                // while filtering, show full text so a match is not hidden by the line clamp
                const open = filtering || expanded.has(index)
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 10) * 0.02 }}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0e1426] dark:shadow-none"
                  >
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold">Chunk #{index}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">{c.snippet.length.toLocaleString()} chars{c.pageNumber != null && ` • p${c.pageNumber}`}</span>
                    </div>
                    <p className={clsx('whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-slate-700 dark:text-slate-300', !open && 'line-clamp-4')}>
                      <HighlightedText text={c.snippet} query={filter} />
                    </p>
                    {c.snippet.length > 280 && !filtering && (
                      <button onClick={() => toggle(index)} className="mt-2 text-xs font-medium text-brand hover:underline">
                        {open ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
