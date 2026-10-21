import { useEffect, useRef, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { FileText, Loader2, Search, SlidersHorizontal } from 'lucide-react'
import { chatApi } from '../../services'
import { toApiError } from '../../services/http'
import { useAppStore } from '../../store/appStore'
import type { SearchResult } from '../../types/chat'
import HighlightedText from '../../components/ui/HighlightedText'

// A category rewrites the query to lean toward that kind of passage.
const categories = [
  { id: 'all', label: 'All', icon: '🔍', shape: (q: string) => q },
  { id: 'clauses', label: 'Clauses', icon: '📋', shape: (q: string) => `${q} clause` },
  { id: 'facts', label: 'Facts & Data', icon: '📊', shape: (q: string) => `facts, figures and data about ${q}` },
  { id: 'definitions', label: 'Definitions', icon: '📚', shape: (q: string) => `definition of ${q}` },
] as const
type CategoryId = (typeof categories)[number]['id']

const suggestions = ['payment terms', 'termination clause', 'liability cap', 'force majeure', 'intellectual property', 'governing law', 'warranty']

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'done'; query: string; results: SearchResult }

export default function SearchPage() {
  const documents = useAppStore((s) => s.documents)
  const selectedId = useAppStore((s) => s.selectedDocumentId)
  const selectDocument = useAppStore((s) => s.selectDocument)
  const selected = documents.find((d) => d.id === selectedId)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [topK, setTopK] = useState(10)
  const [minSimilarity, setMinSimilarity] = useState(0)
  const [state, setState] = useState<State>({ status: 'idle' })
  const inputRef = useRef<HTMLInputElement>(null)
  const requestId = useRef(0)

  useEffect(() => { inputRef.current?.focus() }, [])

  const run = async (text: string = query, cat: CategoryId = category) => {
    const q = text.trim()
    if (!q) return
    const id = ++requestId.current
    setState({ status: 'loading' })
    try {
      const shape = categories.find((c) => c.id === cat)?.shape ?? ((x: string) => x)
      const results = await chatApi.searchSimilar({
        query: shape(q),
        documentId: selectedId ?? undefined,
        topK,
        similaritySearch: minSimilarity, // 0 = every nearest chunk, not just those above the chat threshold
      })
      if (id === requestId.current) setState({ status: 'done', query: q, results })
    } catch (err) {
      if (id === requestId.current) setState({ status: 'error', error: toApiError(err).message })
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void run()
  }

  const tryQuery = (q: string) => {
    setQuery(q)
    void run(q)
  }

  const pickCategory = (c: CategoryId) => {
    setCategory(c)
    if (query.trim() && state.status !== 'idle') void run(query, c)
  }

  const matches = state.status === 'done' ? (state.results.matches ?? []) : []

  return (
    <div className="thin-scroll flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/15 text-brand"><Search size={18} /></span>
            <h1 className="text-lg font-semibold">Semantic Search</h1>
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={clsx(
              'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition',
              showFilters ? 'border-brand text-brand' : 'border-slate-200 text-slate-600 hover:border-brand/50 dark:border-slate-700 dark:text-slate-300',
            )}
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3 dark:border-slate-800 dark:bg-[#0e1426] dark:shadow-none"
          >
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Search in
              <select
                value={selectedId ?? ''}
                onChange={(e) => selectDocument(e.target.value || null)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none focus:border-brand dark:border-slate-700 dark:text-slate-100"
              >
                <option value="">All documents ({documents.length})</option>
                {documents.map((d) => <option key={d.id} value={d.id}>{d.filename}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Results (top K)
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none focus:border-brand dark:border-slate-700 dark:text-slate-100"
              >
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Minimum similarity: <span className="text-slate-900 dark:text-slate-100">{minSimilarity === 0 ? 'any' : `${Math.round(minSimilarity * 100)}%`}</span>
              <input
                type="range"
                min={0}
                max={0.9}
                step={0.05}
                value={minSimilarity}
                onChange={(e) => setMinSimilarity(Number(e.target.value))}
                className="mt-3 w-full accent-[var(--color-brand)]"
              />
            </label>
          </motion.div>
        )}

        <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Search category">
          {categories.map((c) => (
            <button
              key={c.id}
              role="radio"
              aria-checked={category === c.id}
              onClick={() => pickCategory(c.id)}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition',
                category === c.id
                  ? 'bg-brand-strong text-white shadow-md shadow-brand/30'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-brand/50 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300',
              )}
            >
              <span aria-hidden>{c.icon}</span> {c.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 flex gap-3">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any concept, topic or keyword..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-11 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-900/60"
            />
          </div>
          <button
            disabled={!query.trim() || state.status === 'loading'}
            className="flex items-center gap-2 rounded-xl bg-brand-strong px-6 text-sm font-semibold text-white shadow-md shadow-brand/30 transition hover:brightness-110 disabled:opacity-50"
          >
            {state.status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-600 dark:text-slate-400">Try:</span>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => tryQuery(s)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600 transition hover:border-brand/50 hover:text-brand dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {state.status === 'idle' && (
            <div className="flex flex-col items-center py-14 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700/70 dark:bg-slate-900/60">
                <Search size={34} strokeWidth={1.5} />
              </span>
              <h2 className="mt-5 text-lg font-semibold">Search your documents</h2>
              <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
                Use vector similarity search to find relevant clauses, concepts, facts, and definitions across all your indexed documents.
              </p>
            </div>
          )}
          {state.status === 'loading' && <div className="flex justify-center py-14 text-brand"><Loader2 className="animate-spin" /></div>}
          {state.status === 'error' && <p className="py-10 text-center text-sm text-red-700 dark:text-red-400">{state.error}</p>}
          {state.status === 'done' && matches.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-600 dark:text-slate-400">
              No matching chunks found in {selected ? selected.filename : 'your documents'}. Try different words or lower the minimum similarity.
            </p>
          )}
          {state.status === 'done' && matches.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {state.results.totalMatches} matches in {selected ? selected.filename : 'all documents'}
              </p>
              {matches.map((m, i) => (
                <motion.div
                  key={`${m.documentId}-${m.chunkIndex}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.03 }}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0e1426] dark:shadow-none"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5 font-semibold">
                      <FileText size={13} className="shrink-0 text-slate-500" />
                      <span className="truncate">{m.fileName}</span>
                      <span className="font-normal text-slate-600 dark:text-slate-400">• Chunk #{m.chunkIndex ?? '?'}{m.pageNumber != null && ` • p${m.pageNumber}`}</span>
                    </span>
                    {m.similarityScore != null && (
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.max(0, Math.min(100, m.similarityScore * 100))}%` }} />
                        </span>
                        <span className="font-semibold text-brand">{(m.similarityScore * 100).toFixed(1)}%</span>
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-6 whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
                    <HighlightedText text={m.snippet} query={state.query} />
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
