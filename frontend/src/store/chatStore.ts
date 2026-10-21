import { create } from 'zustand'
import { chatApi } from '../services/chatApi'
import { conversationApi } from '../services/conversationApi'
import { toApiError } from '../services/http'
import { uuid } from '../lib/utils'
import type { ChatMessage, ChatMessageView, Conversation } from '../types/chat'
import { useAuthStore } from './authStore'

interface ChatState {
  conversations: Conversation[]
  /** true until the first list() resolves (the sidebar shows a skeleton, not "no chats yet") */
  conversationsLoading: boolean
  /** null = new chat, no message sent yet (no id minted) */
  activeConversationId: string | null
  messages: ChatMessageView[]
  historyLoading: boolean
  sending: boolean
  streamTokens: boolean

  loadConversations: () => Promise<void>
  startNewChat: () => void
  /** Resolves false for an unknown id; the caller falls back to a new chat. */
  openConversation: (id: string) => Promise<boolean>
  send: (question: string, documentId: string | null) => Promise<void>
  stop: () => void
  deleteConversation: (id: string) => Promise<void>
  renameConversation: (id: string, title: string) => Promise<void>
  setStreamTokens: (on: boolean) => void
  reset: () => void
}

const initial = {
  conversations: [] as Conversation[],
  conversationsLoading: true,
  activeConversationId: null as string | null,
  messages: [] as ChatMessageView[],
  historyLoading: false,
  sending: false,
  streamTokens: true,
}

let abortController: AbortController | null = null

const now = () => new Date().toISOString()
const titleOf = (question: string) => (question.length > 50 ? question.slice(0, 50) : question) // same 50-char rule as the backend

/** Saved shape: drops UI-only fields and unfinished or failed replies. */
const toPersisted = (messages: ChatMessageView[]): ChatMessage[] =>
  messages
    .filter((m) => !m.error && !(m.messageType === 'ASSISTANT' && !m.content))
    .map(({ id, messageType, content, createdAt }) => ({ id, messageType, content, createdAt }))

export const useChatStore = create<ChatState>((set, get) => ({
  ...initial,

  loadConversations: async () => {
    try {
      set({ conversations: await conversationApi.list() })
    } finally {
      set({ conversationsLoading: false })
    }
  },

  startNewChat: () => {
    abortController?.abort()
    set({ activeConversationId: null, messages: [], sending: false, historyLoading: false })
  },

  openConversation: async (id) => {
    abortController?.abort()
    set({ activeConversationId: id, messages: [], sending: false, historyLoading: true })
    const history = await conversationApi.getMessages(id)
    if (get().activeConversationId !== id) return true // user moved on while loading
    if (history.length === 0) {
      // A real chat always has its first question stored, so empty means a stale or made-up id.
      set({ activeConversationId: null, messages: [], historyLoading: false })
      return false
    }
    set({ messages: history, historyLoading: false })
    return true
  },

  send: async (rawQuestion, documentId) => {
    const question = rawQuestion.trim()
    const { sending, streamTokens } = get()
    if (!question || sending) return

    // One id per chat: minted before the first message and sent with every later one (stream and query),
    // so the backend keeps a single conversation.
    const isNewChat = get().activeConversationId === null
    let conversationId = get().activeConversationId ?? uuid()

    const userMessage: ChatMessageView = { id: uuid(), messageType: 'USER', content: question, createdAt: now() }
    const botMessage: ChatMessageView = { id: uuid(), messageType: 'ASSISTANT', content: '', createdAt: now(), pending: true }
    const base = [...get().messages, userMessage] // snapshot, so saving does not depend on UI state
    set({ activeConversationId: conversationId, messages: [...base, botMessage], sending: true })

    const patchBot = (change: Partial<ChatMessageView>) => {
      Object.assign(botMessage, change)
      if (get().activeConversationId === conversationId) {
        set((s) => ({ messages: s.messages.map((m) => (m.id === botMessage.id ? { ...botMessage } : m)) }))
      }
    }

    const existing = get().conversations.find((c) => c.id === conversationId)
    const createdAt = existing?.createdAt ?? now()
    const title = existing?.title ?? titleOf(question)

    abortController = new AbortController()
    const { signal } = abortController
    const body = { question, conversationId, documentId: documentId ?? undefined }
    const started = Date.now()

    try {
      if (streamTokens) {
        await chatApi.stream(body, { signal, onToken: (token) => patchBot({ content: botMessage.content + token }) })
        patchBot({ pending: false, responseTimeMs: Date.now() - started })
      } else {
        const res = await chatApi.ask(body)
        // the backend echoes the id we sent
        conversationId = res.conversationId ?? conversationId
        patchBot({ content: res.answer, citations: res.citations, responseTimeMs: res.responseTimeMs, pending: false })
        if (get().activeConversationId !== conversationId && get().messages.some((m) => m.id === botMessage.id)) {
          set({ activeConversationId: conversationId })
        }
      }
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError'
      patchBot(aborted ? { pending: false } : { pending: false, error: toApiError(err).message || 'Failed to get an answer' })
    } finally {
      // only the latest request may flip `sending` (an aborted older one must not)
      if (abortController?.signal === signal) {
        abortController = null
        set({ sending: false })
      }
    }

    // Save to the local history cache (services/conversationApi.ts).
    if (isNewChat && botMessage.error) return // first message failed: nothing worth saving
    const updatedAt = now()
    await conversationApi.saveMessages(conversationId, toPersisted([...base, botMessage]))
    await conversationApi.saveConversation({ id: conversationId, title, createdAt, updatedAt })
    await get().loadConversations()
  },

  stop: () => abortController?.abort(),

  deleteConversation: async (id) => {
    await conversationApi.remove(id)
    if (get().activeConversationId === id) get().startNewChat()
    await get().loadConversations()
  },

  renameConversation: async (id, title) => {
    await conversationApi.rename(id, title)
    await get().loadConversations()
  },

  setStreamTokens: (streamTokens) => set({ streamTokens }),

  reset: () => {
    abortController?.abort()
    set({ ...initial })
  },
}))

// On sign-out or user change, drop in-memory chats; the next user loads their own cache.
useAuthStore.subscribe((state, prev) => {
  if (state.session?.user.id !== prev.session?.user.id) useChatStore.getState().reset()
})
