import { useEffect } from 'react'
import { useLocation, useNavigate, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Header from './Header'
import ErrorBoundary from '../ui/ErrorBoundary'
import Sidebar from './Sidebar'
import UploadModal from '../../features/documents/UploadModal'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { useChatStore } from '../../store/chatStore'

/** Which view a path belongs to ("/" and "/c/:id" are the same view, so a new chat does not re-animate). */
const viewOf = (pathname: string) => (pathname.startsWith('/search') ? 'search' : pathname.startsWith('/chunks') ? 'chunks' : 'chat')

/** Shell for every signed-in screen: header, sidebar, the routed view and the upload dialog. */
export default function WorkspaceLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const outlet = useOutlet() // an element, so the outgoing view can finish its exit animation
  const userId = useAuthStore((s) => s.session?.user.id)
  const fetchDocuments = useAppStore((s) => s.fetchDocuments)
  const loadConversations = useChatStore((s) => s.loadConversations)
  const error = useAppStore((s) => s.documentsError)

  // Load the user's data (and reload when a different user signs in).
  useEffect(() => {
    void fetchDocuments()
    void loadConversations()
  }, [userId, fetchDocuments, loadConversations])

  // Ctrl/Cmd+K opens Search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        navigate('/search')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <div className="flex h-full flex-col">
      <a
        href="#main"
        className="sr-only z-[60] rounded-lg bg-brand-strong px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col outline-none">
          {error && (
            <div role="alert" className="bg-red-500/10 px-4 py-2 text-center text-sm text-red-700 dark:text-red-400">
              Couldn&apos;t load documents: {error}
              <button onClick={() => void fetchDocuments()} className="ml-2 rounded font-semibold underline">Retry</button>
            </div>
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={viewOf(pathname)}
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ErrorBoundary resetKey={pathname} compact>
                {outlet}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <UploadModal />
    </div>
  )
}
