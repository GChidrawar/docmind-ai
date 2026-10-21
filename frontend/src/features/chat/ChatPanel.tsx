import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Download, RotateCcw, Send, Sparkles, Square, X, Zap } from 'lucide-react'
import MessageBubble from './MessageBubble'
import { getTemplates } from './templates'
import { MessagesSkeleton } from '../../components/ui/Skeleton'
import { notify } from '../../lib/notify'
import { useAppStore } from '../../store/appStore'
import { useChatStore } from '../../store/chatStore'

export default function ChatPanel() {
  const navigate = useNavigate()
  const messages = useChatStore((s) => s.messages)
  const activeId = useChatStore((s) => s.activeConversationId)
  const sending = useChatStore((s) => s.sending)
  const historyLoading = useChatStore((s) => s.historyLoading)
  const streamTokens = useChatStore((s) => s.streamTokens)
  const setStreamTokens = useChatStore((s) => s.setStreamTokens)
  const send = useChatStore((s) => s.send)
  const stop = useChatStore((s) => s.stop)
  const deleteConversation = useChatStore((s) => s.deleteConversation)

  const documents = useAppStore((s) => s.documents)
  const selectedId = useAppStore((s) => s.selectedDocumentId)
  const selectDocument = useAppStore((s) => s.selectDocument)
  const selected = documents.find((d) => d.id === selectedId)

  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    endRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'end' })
  }, [messages])
  // Focus the message box when the chat changes, unless that is disruptive: on touch screens (opens the keyboard)
  // or while the user is in the sidebar, header or a dialog (steals focus, e.g. from a rename field).
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const active = document.activeElement
    if (active && active !== document.body && active.closest('aside, header, [role=dialog]')) return
    taRef.current?.focus()
  }, [activeId, selectedId])

  const ask = (text: string) => {
    if (!text.trim() || sending) return
    setInput('')
    void send(text, selectedId)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask(input)
    }
  }

  const exportChat = () => {
    const md = messages.map((m) => `**${m.messageType === 'USER' ? 'You' : 'DocMind'}:**\n\n${m.content}`).join('\n\n---\n\n')
    const url = URL.createObjectURL(new Blob([`# DocMind chat\n\n${md}\n`], { type: 'text/markdown' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'docmind-chat.md' })
    a.click()
    URL.revokeObjectURL(url)
  }

  const clear = async () => {
    if (!activeId) return
    await deleteConversation(activeId)
    navigate('/')
    notify.success('Chat cleared')
  }

  const hasMessages = messages.length > 0
  const placeholder = selected ? 'Ask a question about this document...' : 'Ask a question across all documents...'

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 text-sm sm:px-5 dark:border-slate-800/80">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
          <span className="text-slate-600 dark:text-slate-400">Context:</span>
          <span className="truncate font-semibold">{selected ? selected.filename : 'All Uploaded Documents'}</span>
          {selected && (
            <button onClick={() => selectDocument(null)} className="rounded-md p-1 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200" aria-label="Clear document scope" title="Chat with all documents">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4 text-slate-600 dark:text-slate-400">
          <label className="flex cursor-pointer items-center gap-2 select-none">
            <button
              role="switch"
              aria-label="Stream tokens"
              aria-checked={streamTokens}
              onClick={() => setStreamTokens(!streamTokens)}
              disabled={sending}
              className={clsx('relative h-5 w-9 rounded-full transition', streamTokens ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-700')}
            >
              <span className={clsx('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', streamTokens ? 'left-[18px]' : 'left-0.5')} />
            </button>
            <span className="hidden sm:inline">Stream Tokens</span>
          </label>
          {hasMessages && (
            <>
              <button onClick={exportChat} aria-label="Export chat" className="flex items-center gap-1.5 rounded hover:text-slate-900 dark:hover:text-white"><Download size={15} aria-hidden="true" /><span className="hidden sm:inline">Export</span></button>
              <button onClick={() => void clear()} aria-label="Clear chat" className="flex items-center gap-1.5 rounded hover:text-slate-900 dark:hover:text-white"><RotateCcw size={15} aria-hidden="true" /><span className="hidden sm:inline">Clear</span></button>
            </>
          )}
        </div>
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto">
        {historyLoading ? (
          <MessagesSkeleton />
        ) : !hasMessages ? (
          <div className="mx-auto flex min-h-full max-w-[720px] flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-from to-brand-to text-white shadow-lg shadow-brand/30"><Sparkles size={30} /></span>
            <h1 className="mt-6 text-2xl font-bold sm:text-3xl">DocMind AI Document Assistant</h1>
            <p className="mt-3 max-w-lg text-slate-600 dark:text-slate-400">
              Upload PDF reports, Word files, or notes and chat naturally with grounded facts, source citations, and page numbers.
            </p>
            <div className="mt-9 grid w-full gap-4 sm:grid-cols-2">
              {getTemplates(!!selected).map((t) => (
                <button
                  key={t.title}
                  onClick={() => ask(t.prompt)}
                  disabled={sending}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition dark:shadow-none hover:border-brand/50 hover:shadow-md disabled:opacity-60 dark:border-slate-800 dark:bg-[#0e1426] dark:hover:border-brand/60"
                >
                  <div className="font-semibold text-brand">{t.icon} {t.title}</div>
                  <div className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[900px] space-y-5 px-3 py-6 sm:space-y-7 sm:px-6 sm:py-8">
            <h1 className="sr-only">Conversation</h1>
            {messages.map((m, i) => <MessageBubble key={m.id} message={m} deferred={i < messages.length - 20} />)}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 px-4 pt-4 pb-3 dark:border-slate-800/80">
        <div className="mx-auto max-w-[900px]">
          <div className="flex items-end gap-2 rounded-[28px] border border-slate-300 bg-white py-2 pr-2 pl-5 focus-within:border-brand dark:border-slate-700 dark:bg-[#060a16]">
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              aria-label="Message"
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-[15px] outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            {sending ? (
              <button onClick={stop} className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200" aria-label="Stop generating">
                <Square size={16} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={() => ask(input)}
                disabled={!input.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-slate-600 transition enabled:bg-brand-strong enabled:text-white enabled:hover:brightness-110 disabled:opacity-70 dark:bg-slate-800 dark:text-slate-300"
                aria-label="Send"
              >
                <Send size={18} />
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-xs text-slate-600 dark:text-slate-400">
            <span className="hidden sm:inline">
              Press <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono dark:border-slate-700 dark:bg-slate-800">Enter</kbd> to send,{' '}
              <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono dark:border-slate-700 dark:bg-slate-800">Shift+Enter</kbd> for newline
            </span>
            <span className="flex items-center gap-1 font-medium text-brand"><Zap size={13} /> Grounded RAG</span>
          </div>
        </div>
      </div>
    </section>
  )
}
