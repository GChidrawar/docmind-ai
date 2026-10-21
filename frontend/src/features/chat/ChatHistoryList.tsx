import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import { ChatListSkeleton } from '../../components/ui/Skeleton'
import { groupByDay, timeAgo } from '../../lib/utils'
import { notify } from '../../lib/notify'
import { toApiError } from '../../services/http'
import { useChatStore } from '../../store/chatStore'
import type { Conversation } from '../../types/chat'

const FILTER_THRESHOLD = 5 // show the filter box only above this many chats
const MAX_TITLE = 80

/** Inline title editor: Enter or blur saves, Escape cancels (a flag prevents a double save). */
function RenameInput({ initial, onCommit, onCancel }: { initial: string; onCommit: (title: string) => void; onCancel: () => void }) {
  const finished = useRef(false)
  const finish = (save: boolean, value: string) => {
    if (finished.current) return
    finished.current = true
    if (save) onCommit(value)
    else onCancel()
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') finish(true, e.currentTarget.value)
    else if (e.key === 'Escape') finish(false, '')
  }
  return (
    <input
      autoFocus
      defaultValue={initial}
      maxLength={MAX_TITLE}
      aria-label="Chat title"
      onFocus={(e) => e.currentTarget.select()}
      onKeyDown={onKeyDown}
      onBlur={(e) => finish(true, e.currentTarget.value)}
      className="min-w-0 flex-1 rounded-md border border-brand bg-white px-2 py-1 text-sm outline-none ring-2 ring-brand/25 dark:bg-[#0b1226]"
    />
  )
}

/** "Chats" tab: past conversations (a localStorage cache until the backend has endpoints). */
export default function ChatHistoryList({ onNavigate }: { onNavigate: () => void }) {
  const navigate = useNavigate()
  const conversations = useChatStore((s) => s.conversations)
  const loading = useChatStore((s) => s.conversationsLoading)
  const activeId = useChatStore((s) => s.activeConversationId)
  const startNewChat = useChatStore((s) => s.startNewChat)
  const deleteConversation = useChatStore((s) => s.deleteConversation)
  const renameConversation = useChatStore((s) => s.renameConversation)

  const [filter, setFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const showFilter = conversations.length > FILTER_THRESHOLD
  const query = showFilter ? filter.trim().toLowerCase() : ''
  const visible = useMemo(
    () => (query ? conversations.filter((c) => c.title.toLowerCase().includes(query)) : conversations),
    [conversations, query],
  )
  const groups = useMemo(() => groupByDay(visible), [visible])

  const newChat = () => {
    startNewChat()
    navigate('/')
    onNavigate()
  }

  const open = (id: string) => {
    navigate(`/c/${id}`)
    onNavigate()
  }

  const commitRename = async (c: Conversation, raw: string) => {
    setEditingId(null)
    const title = raw.trim().slice(0, MAX_TITLE)
    if (!title || title === c.title) return
    try {
      await renameConversation(c.id, title)
      notify.success('Chat renamed')
    } catch (err) {
      notify.error('rename the chat', toApiError(err).message)
    }
  }

  const remove = async (c: Conversation) => {
    const wasActive = c.id === activeId
    setConfirmId(null)
    try {
      await deleteConversation(c.id)
      if (wasActive) navigate('/')
      notify.success('Chat deleted')
    } catch (err) {
      notify.error('delete the chat', toApiError(err).message)
    }
  }

  const iconBtn = 'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition focus-visible:outline-offset-[-2px] dark:text-slate-400'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 p-3">
        <button
          onClick={newChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-strong px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <Plus size={16} aria-hidden="true" /> New chat
        </button>
        {showFilter && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter chats..."
              aria-label="Filter chats"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900/60"
            />
          </div>
        )}
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto px-3 pb-4">
        {loading ? (
          <ChatListSkeleton />
        ) : conversations.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No chats yet" hint="Ask a question about your documents and the conversation shows up here." />
        ) : visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-600 dark:text-slate-400">No chats match &ldquo;{filter.trim()}&rdquo;.</p>
        ) : (
          groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h3 className="px-3 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{group.label}</h3>
              <ul role="list" className="space-y-1">
                <AnimatePresence initial={false}>
                  {group.items.map((c) => (
                    <motion.li
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.16 }}
                      className={clsx(
                        'group rounded-xl border px-3 py-2 transition-colors',
                        c.id === activeId ? 'border-brand/50 bg-brand/10' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50',
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {editingId === c.id ? (
                          <>
                            <MessageSquare size={16} className="shrink-0 text-slate-500" aria-hidden="true" />
                            <RenameInput initial={c.title} onCommit={(t) => void commitRename(c, t)} onCancel={() => setEditingId(null)} />
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => open(c.id)}
                              onDoubleClick={() => setEditingId(c.id)}
                              onKeyDown={(e) => { if (e.key === 'F2') { e.preventDefault(); setEditingId(c.id) } }}
                              aria-current={c.id === activeId ? 'page' : undefined}
                              title="Double-click or press F2 to rename"
                              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left"
                            >
                              <MessageSquare size={16} className="shrink-0 text-slate-500" aria-hidden="true" />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium">{c.title}</span>
                                <span className="block text-xs text-slate-600 dark:text-slate-400">{timeAgo(c.updatedAt)}</span>
                              </span>
                            </button>
                            <span className="flex shrink-0 items-center overflow-hidden transition-[width] duration-150 w-0 group-hover:w-14 group-focus-within:w-14 [@media(hover:none)]:w-14">
                            <button onClick={() => setEditingId(c.id)} className={clsx(iconBtn, 'hover:bg-slate-200/70 hover:text-slate-900 dark:hover:bg-slate-700/60 dark:hover:text-white')} aria-label={`Rename chat ${c.title}`}>
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setConfirmId(c.id)} className={clsx(iconBtn, 'hover:bg-red-500/10 hover:text-red-600')} aria-label={`Delete chat ${c.title}`}>
                              <Trash2 size={15} />
                            </button>
                            </span>
                          </>
                        )}
                      </div>
                      <AnimatePresence initial={false}>
                        {confirmId === c.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs">
                              <span className="text-red-700 dark:text-red-400">Delete this chat?</span>
                              <span className="flex gap-1.5">
                                <button onClick={() => void remove(c)} className="rounded-md bg-red-700 px-2.5 py-1 font-semibold text-white hover:bg-red-800">Delete</button>
                                <button autoFocus onClick={() => setConfirmId(null)} className="rounded-md border border-slate-400 px-2.5 py-1 font-medium dark:border-slate-600">Keep</button>
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
