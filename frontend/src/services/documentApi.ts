import { request } from './http'
import type { DocumentMetadata, DocumentUploadResult } from '../types/document'

export interface UploadCallbacks {
  /** 0-100 while the file is being sent */
  onProgress?: (percent: number) => void
  /** file fully sent; the server is now indexing it */
  onSent?: () => void
  signal?: AbortSignal
}

export const documentApi = {
  list: () => request<DocumentMetadata[] | null>({ method: 'GET', url: '/documents' }).then((d) => d ?? []),

  remove: (id: string) => request<null>({ method: 'DELETE', url: `/documents/${id}` }),

  removeAll: () => request<null>({ method: 'DELETE', url: '/documents' }),

  /** Uploads one file with progress (axios reports it; fetch cannot). */
  upload(file: File, { onProgress, onSent, signal }: UploadCallbacks = {}) {
    const form = new FormData()
    form.append('file', file)
    let sent = false
    return request<DocumentUploadResult>({
      method: 'POST',
      url: '/documents/upload',
      data: form,
      signal,
      timeout: 0, // large files can take minutes to index
      onUploadProgress: (e) => {
        if (!e.total) return
        onProgress?.(Math.round((e.loaded / e.total) * 100))
        if (!sent && e.loaded >= e.total) { sent = true; onSent?.() }
      },
    })
  },
}
