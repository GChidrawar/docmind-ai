// TODO(backend): replace with real endpoints.
// The backend stores chats but has no list / reload / rename / delete endpoint, so this keeps a per-user cache in
// localStorage: docmind:{userId}:conversations and docmind:{userId}:messages:{conversationId}.
// With real endpoints only list / getMessages / rename / remove change; saveConversation / saveMessages can go,
// since the server records chats itself.
import { useAuthStore } from '../store/authStore'
import type { ChatMessage, Conversation } from '../types/chat'

const conversationsKey = (userId: number) => `docmind:${userId}:conversations`
const messagesKey = (userId: number, conversationId: string) => `docmind:${userId}:messages:${conversationId}`

const currentUserId = (): number | null => useAuthStore.getState().session?.user.id ?? null

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked: the chat works, it just is not remembered */
  }
}

const byNewest = (a: Conversation, b: Conversation) => b.updatedAt.localeCompare(a.updatedAt)

export const conversationApi = {
  /** Past chats of the signed-in user, newest first. */
  async list(): Promise<Conversation[]> {
    const userId = currentUserId()
    if (userId === null) return []
    return read<Conversation[]>(conversationsKey(userId), []).sort(byNewest)
  },

  /** Messages of one chat, oldest first. */
  async getMessages(id: string): Promise<ChatMessage[]> {
    const userId = currentUserId()
    if (userId === null) return []
    return read<ChatMessage[]>(messagesKey(userId, id), [])
  },

  async remove(id: string): Promise<void> {
    const userId = currentUserId()
    if (userId === null) return
    write(conversationsKey(userId), read<Conversation[]>(conversationsKey(userId), []).filter((c) => c.id !== id))
    try {
      localStorage.removeItem(messagesKey(userId, id))
    } catch {
      /* storage unavailable */
    }
  },

  /** Renames a chat without touching `updatedAt`, so it keeps its place in the list. */
  async rename(id: string, title: string): Promise<void> {
    const userId = currentUserId()
    if (userId === null) return
    const all = read<Conversation[]>(conversationsKey(userId), [])
    write(conversationsKey(userId), all.map((c) => (c.id === id ? { ...c, title } : c)))
  },

  // Cache-only writers (no backend equivalent)

  async saveConversation(conversation: Conversation): Promise<void> {
    const userId = currentUserId()
    if (userId === null) return
    const all = read<Conversation[]>(conversationsKey(userId), []).filter((c) => c.id !== conversation.id)
    write(conversationsKey(userId), [conversation, ...all])
  },

  async saveMessages(id: string, messages: ChatMessage[]): Promise<void> {
    const userId = currentUserId()
    if (userId === null) return
    write(messagesKey(userId, id), messages)
  },
}
