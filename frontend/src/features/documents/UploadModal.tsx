import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { notify } from '../../lib/notify'
import { CheckCircle2, CircleAlert, FileText, Loader2, UploadCloud, X } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { documentApi } from '../../services'
import { toApiError } from '../../services/http'
import { ACCEPTED_EXT, MAX_UPLOAD_BYTES, formatSize } from '../../lib/utils'
import { useAppStore } from '../../store/appStore'
import type { DocumentUploadResult } from '../../types/document'

// phases: idle -> uploading (real byte progress) -> indexing (server-side embed) -> done | error
type Phase = 'idle' | 'uploading' | 'indexing' | 'done' | 'error'

function validate(f: File): string {
  const ext = `.${f.name.split('.').pop()?.toLowerCase() ?? ''}`
  if (!ACCEPTED_EXT.includes(ext)) return `Unsupported file type (${ext}). Allowed: ${ACCEPTED_EXT.join(', ')}`
  if (f.size > MAX_UPLOAD_BYTES) return 'File exceeds the 25MB limit.'
  if (f.size === 0) return 'File is empty.'
  return ''
}

export default function UploadModal() {
  const open = useAppStore((s) => s.uploadOpen)
  const initialFile = useAppStore((s) => s.droppedFile)
  const closeUpload = useAppStore((s) => s.closeUpload)
  const fetchDocuments = useAppStore((s) => s.fetchDocuments)

  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [percent, setPercent] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState<DocumentUploadResult | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const busy = phase === 'uploading' || phase === 'indexing'

  const reset = useCallback(() => {
    setFile(null); setPhase('idle'); setPercent(0); setError(''); setResult(null)
  }, [])

  const start = useCallback(async (f: File) => {
    const problem = validate(f)
    setFile(f)
    setError(problem)
    setResult(null)
    if (problem) { setPhase('error'); return }
    setPhase('uploading')
    setPercent(0)
    abortRef.current = new AbortController()
    try {
      const data = await documentApi.upload(f, {
        signal: abortRef.current.signal,
        onProgress: setPercent,
        onSent: () => { setPercent(100); setPhase('indexing') },
      })
      setResult(data)
      setPhase('done')
      notify.success(`${f.name} uploaded and indexed`)
    } catch (err) {
      const e = toApiError(err)
      if (e.message === 'Request cancelled') { reset(); return }
      setError(e.message)
      setPhase('error')
      notify.error(`upload ${f.name}`, e.message)
    } finally {
      void fetchDocuments() // the backend may have stored a FAILED record
    }
  }, [fetchDocuments, reset])

  // start at once when opened with a dropped file, otherwise reset
  useEffect(() => {
    if (!open) return
    if (initialFile) void start(initialFile)
    else reset()
  }, [open, initialFile, start, reset])

  const close = () => {
    if (busy) abortRef.current?.abort()
    closeUpload()
  }

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) void start(f)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f && !busy) void start(f)
  }

  const shownPercent = phase === 'done' ? 100 : percent

  return (
    <Modal open={open} onClose={close} maxWidth="max-w-lg" closeOnBackdrop={!busy}>
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand dark:bg-brand/15 dark:text-brand-light"><UploadCloud size={18} /></span>
          <h2 className="text-lg font-semibold">Upload Document</h2>
        </div>
        <button onClick={close} className="rounded-lg p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Close"><X size={20} /></button>
      </div>

      <div className="space-y-4 p-6">
        {phase === 'idle' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${dragging ? 'border-brand bg-brand-soft dark:bg-brand/10' : 'border-slate-300 hover:border-brand/60 dark:border-slate-700 dark:hover:border-brand/60'}`}
          >
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand dark:bg-brand/15 dark:text-brand-light"><UploadCloud size={28} /></span>
            <p className="text-sm"><span className="font-medium text-brand dark:text-brand-light">Choose a file</span> or drag it here</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">PDF, Word, Markdown, TXT, CSV (max 25MB)</p>
          </div>
        )}

        {phase !== 'idle' && file && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 dark:text-slate-400 shadow-sm dark:bg-slate-800 dark:shadow-none"><FileText size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{file.name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{formatSize(file.size)}</p>
              </div>
              {phase === 'done' && <CheckCircle2 className="text-emerald-500" size={22} />}
              {phase === 'error' && <CircleAlert className="text-red-500" size={22} />}
              {busy && <Loader2 className="animate-spin text-brand dark:text-brand-light" size={20} />}
            </div>

            {(phase === 'uploading' || phase === 'indexing' || phase === 'done') && (
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                  <span>
                    {phase === 'uploading' && 'Uploading…'}
                    {phase === 'indexing' && 'Parsing, embedding & indexing…'}
                    {phase === 'done' && 'Indexed'}
                  </span>
                  <span>{phase === 'indexing' ? '' : `${shownPercent}%`}</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" role="progressbar" aria-valuenow={shownPercent} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${phase === 'done' ? 'bg-emerald-500' : 'bg-brand'} ${phase === 'indexing' ? 'animate-pulse' : ''}`}
                    style={{ width: `${shownPercent}%` }}
                  />
                </div>
                {phase === 'indexing' && <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">This can take a little while for larger documents.</p>}
              </div>
            )}

            {phase === 'done' && result && (
              <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">
                {result.message || 'Document uploaded and indexed successfully'}
                {result.chunksCreated != null && ` — ${result.chunksCreated} chunks created.`}
              </p>
            )}
            {phase === 'error' && <p className="mt-3 text-sm text-red-700 dark:text-red-400">{error}</p>}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
        {phase === 'error' && (
          <button onClick={reset} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Try another file</button>
        )}
        {phase === 'done' && (
          <button onClick={reset} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Upload another</button>
        )}
        <button onClick={close} className="rounded-xl bg-brand-strong px-5 py-2 text-sm font-semibold text-white hover:brightness-110">
          {busy ? 'Cancel' : phase === 'done' ? 'Done' : 'Close'}
        </button>
      </div>
      <input ref={inputRef} type="file" hidden accept={ACCEPTED_EXT.join(',')} onChange={pick} />
    </Modal>
  )
}
