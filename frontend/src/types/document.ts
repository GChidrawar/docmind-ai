export type DocumentStatus = 'UPLOADING' | 'PROCESSING' | 'INDEXED' | 'FAILED'

/** DocumentMetadataDto */
export interface DocumentMetadata {
  id: string
  filename: string
  contentType: string | null
  fileSize: number | null
  totalPages: number | null
  totalChunks: number | null
  status: DocumentStatus
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

/** DocumentResponseDto (upload result) */
export interface DocumentUploadResult {
  id: string
  fileName: string
  fileSize: number
  status: DocumentStatus
  chunksCreated?: number
  message?: string
}
