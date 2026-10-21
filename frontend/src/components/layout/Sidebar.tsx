import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { FolderOpen, MessageSquare, RefreshCw, Search, Upload, X } from 'lucide-react'
import DocumentCard from '../../features/documents/DocumentCard'
import ChatHistoryList from '../../features/chat/ChatHistoryList'
import EmptyState from '../ui/EmptyState'
import { DocumentListSkeleton } from '../ui/Skeleton'
import { useAppStore, type SidebarTab } from '../../store/appStore'
import { useChatStore } from '../../store/chatStore'

const isOverlay = () => !window.matchMedia('(min-width: 1024px)').matches // below lg the sidebar is an off-canvas drawer

function TabButton({ id, active, onClick, count, children }: { id: SidebarTab; active: boolean; onClick: () => void; count: number | null; children: React.ReactNode }) {
  return (
    <button
      role="tab"
      id={`tab-${id}`}
      aria-selected={active}
      aria-controls={`panel-${id}`}
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
        active ? 'bg-brand-strong text-white shadow shadow-brand/30' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
      )}
    >
      {children}
      <span className={clsx('rounded-md px-1.5 py-px text-[10px]', active ? 'bg-black/25' : 'bg-slate-200 dark:bg-slate-700/70')}>{count ?? '–'}</span>
    </button>
  )
}

export default function Sidebar() {
  const documents = useAppStore((s) => s.documents)
  const loading = useAppStore((s) => s.documentsLoading)
  const refreshing = useAppStore((s) => s.documentsRefreshing)
  const selectedId = useAppStore((s) => s.selectedDocumentId)
  const fetchDocuments = useAppStore((s) => s.fetchDocuments)
  const openUpload = useAppStore((s) => s.openUpload)
  const activeTab = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const open = useAppStore((s) => s.sidebarOpen)
  const setOpen = useAppStore((s) => s.setSidebarOpen)
  const chatCount = useChatStore((s) => s.conversations.length)

  const [filter, setFilter] = useState('')
  const [dragging, setDragging] = useState(false)
  const dragDepth = useRef(0)

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return q ? documents.filter((d) => d.filename.toLowerCase().includes(q)) : documents
  }, [documents, filter])

  // Escape closes the drawer on small screens
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOverlay()) setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const closeOnMobile = () => { if (isOverlay()) setOpen(false) }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) openUpload(file)
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {open && (
          <motion.aside
            key="sidebar"
            aria-label="Library"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-y-0 left-0 z-40 flex w-[300px] max-w-[88vw] flex-col border-r border-slate-200 bg-white lg:static dark:border-slate-800/80 dark:bg-[#0a1020]"
            onDragEnter={(e) => { e.preventDefault(); dragDepth.current++; setDragging(true) }}
            onDragLeave={() => { if (--dragDepth.current <= 0) setDragging(false) }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <h2 className="sr-only">Library</h2>
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-3 dark:border-slate-800/80">
              <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700/70 dark:bg-slate-900/60" role="tablist" aria-label="Library sections">
                <TabButton id="documents" active={activeTab === 'documents'} count={loading ? null : documents.length} onClick={() => setActiveTab('documents')}>
                  <FolderOpen size={13} aria-hidden="true" /> Docs
                </TabButton>
                <TabButton id="chats" active={activeTab === 'chats'} count={chatCount} onClick={() => setActiveTab('chats')}>
                  <MessageSquare size={13} aria-hidden="true" /> Chats
                </TabButton>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => void fetchDocuments()}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label="Refresh documents"
                  title="Refresh"
                >
                  <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label="Close sidebar"
                  title="Close sidebar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {activeTab === 'chats' ? (
              <div role="tabpanel" id="panel-chats" aria-labelledby="tab-chats" className="flex min-h-0 flex-1 flex-col">
                <ChatHistoryList onNavigate={closeOnMobile} />
              </div>
            ) : (
              <div role="tabpanel" id="panel-documents" aria-labelledby="tab-documents" className="relative flex min-h-0 flex-1 flex-col">
                <div className="p-3">
                  <button
                    onClick={() => openUpload()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-strong py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:brightness-110"
                  >
                    <Upload size={16} aria-hidden="true" /> Upload Documents
                  </button>
                  <div className="relative mt-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                    <input
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder="Filter files..."
                      aria-label="Filter files"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900/60"
                    />
                  </div>
                </div>

                <div className="thin-scroll flex-1 space-y-2.5 overflow-y-auto px-3 pb-4">
                  {loading ? (
                    <DocumentListSkeleton />
                  ) : documents.length === 0 ? (
                    <EmptyState
                      icon={FolderOpen}
                      title="No documents yet"
                      hint="Upload a PDF, Word file or notes to start chatting with them."
                      action={
                        <button onClick={() => openUpload()} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:border-brand hover:text-brand dark:border-slate-700">
                          Upload a document
                        </button>
                      }
                    />
                  ) : visible.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-600 dark:text-slate-400">No files match your filter.</p>
                  ) : (
                    <AnimatePresence initial={false}>
                      {visible.map((doc) => (
                        <DocumentCard key={doc.id} doc={doc} selected={selectedId === doc.id} onNavigate={closeOnMobile} />
                      ))}
                    </AnimatePresence>
                  )}
                </div>

                {dragging && (
                  <div className="pointer-events-none absolute inset-2 flex items-center justify-center rounded-2xl border-2 border-dashed border-brand bg-brand/10 text-sm font-semibold text-brand">
                    Drop to upload
                  </div>
                )}
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
