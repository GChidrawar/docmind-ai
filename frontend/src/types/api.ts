/** The envelope the backend wraps every JSON response in. */
export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data: T
  timestamp?: string
}
