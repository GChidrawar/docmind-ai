/** CitationDto */
export interface Citation {
  documentId?: string
  fileName: string
  chunkIndex?: number
  pageNumber?: number
  snippet: string
  similarityScore?: number
  metadata?: Record<string, unknown>
}

/** ChatRequestDto */
export interface ChatRequest {
  question: string
  conversationId: string
  documentId?: string
  topK?: number
  minSimilarity?: number
}

/** ChatResponseDto */
export interface ChatResponse {
  answer: string
  conversationId: string
  citations?: Citation[]
  responseTimeMs?: number
}

/** SearchRequestDto */
export interface SearchRequest {
  query: string
  documentId?: string
  topK?: number
  similaritySearch?: number
}

/** SearchResultDto */
export interface SearchResult {
  query: string
  totalMatches: number
  matches: Citation[] | null
}

export type MessageType = 'USER' | 'ASSISTANT' | 'SYSTEM'

/** Shape of the future backend conversation resource. */
export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

/** Shape of the future backend chat-message resource. */
export interface ChatMessage {
  id: string
  messageType: MessageType
  content: string
  createdAt: string
}

/** A message as rendered in the UI: persisted fields plus transient state. */
export interface ChatMessageView extends ChatMessage {
  pending?: boolean
  error?: string
  citations?: Citation[]
  responseTimeMs?: number
}
