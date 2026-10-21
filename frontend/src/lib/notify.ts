import toast from 'react-hot-toast'

/**
 * The only way to show toasts, so the wording stays consistent:
 *  - success: past tense, no period          -> "Chat deleted"
 *  - error:   "Couldn't <what>[: <reason>]"  -> "Couldn't upload report.pdf: File is empty."
 */
export const notify = {
  success: (message: string) => toast.success(message),
  error: (what: string, reason?: string) => toast.error(reason ? `Couldn't ${what}: ${reason}` : `Couldn't ${what}`),
}
