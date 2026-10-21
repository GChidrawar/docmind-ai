// TODO(backend): replace with a real "list chunks" endpoint.
// Until then: similarity search scoped to one document (no threshold, large topK), ordered by chunkIndex.
// May miss chunks in very large documents (topK is capped by backend validation).
import { chatApi } from './chatApi'
import type { Citation } from '../types/chat'
import type { DocumentMetadata } from '../types/document'

const MAX_CHUNKS = 100

export const chunkApi = {
  async listForDocument(doc: Pick<DocumentMetadata, 'id' | 'filename'>): Promise<Citation[]> {
    const result = await chatApi.searchSimilar({
      query: doc.filename.replace(/\.[^.]+$/, '') || doc.filename,
      documentId: doc.id,
      topK: MAX_CHUNKS,
      similaritySearch: 0,
    })
    return [...(result.matches ?? [])].sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0))
  },
}
