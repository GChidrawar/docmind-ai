import { API_BASE, ApiError, forceLogout, getAccessToken, refreshSession, request, toApiError } from './http'
import type { ChatRequest, ChatResponse, SearchRequest, SearchResult } from '../types/chat'

export interface StreamCallbacks {
  onToken: (text: string) => void
  signal?: AbortSignal
}

/** Parses one SSE event: its text, DONE for the end marker, or null if it has no data. */
const DONE = Symbol('done')
function parseEvent(raw: string): string | typeof DONE | null {
  const lines = raw.split('\n').filter((l) => l.startsWith('data:'))
  if (!lines.length) return null
  // Spring sends `data:<token>` without a space, so a token's leading space is real text.
  const text = lines.map((l) => l.slice(5)).join('\n')
  return text === '[DONE]' ? DONE : text
}

async function openStream(body: ChatRequest, signal?: AbortSignal): Promise<Response> {
  const run = () =>
    fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      },
      body: JSON.stringify(body),
    })

  let res = await run()
  if (res.status === 401) {
    try {
      await refreshSession()
      res = await run()
    } catch {
      forceLogout()
      throw new ApiError('Session expired, please sign in again', 401)
    }
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { message?: string } | null
    throw new ApiError(err?.message ?? `Request failed (${res.status})`, res.status)
  }
  return res
}

export const chatApi = {
  /** Non-streaming answer with citations. */
  ask: (body: ChatRequest) => request<ChatResponse>({ method: 'POST', url: '/chat/query', data: body, timeout: 0 }),

  /** Streaming answer over SSE. Uses raw fetch because axios cannot read a chunked body incrementally. Resolves on [DONE]. */
  async stream(body: ChatRequest, { onToken, signal }: StreamCallbacks): Promise<void> {
    try {
      const res = await openStream(body, signal)
      if (!res.body) throw new ApiError('Streaming is not supported by this browser')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
        let idx: number
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const parsed = parseEvent(buffer.slice(0, idx))
          buffer = buffer.slice(idx + 2)
          if (parsed === DONE) { await reader.cancel().catch(() => {}); return }
          if (parsed !== null) onToken(parsed)
        }
      }
      const tail = buffer.trim() ? parseEvent(buffer) : null
      if (tail !== null && tail !== DONE) onToken(tail)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
      throw toApiError(err)
    }
  },

  searchSimilar: (body: SearchRequest) =>
    request<SearchResult>({ method: 'POST', url: '/chat/search/similarity', data: body, timeout: 0 }),
}
