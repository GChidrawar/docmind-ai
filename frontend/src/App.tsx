import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import ProtectedRoute from './features/auth/ProtectedRoute'
import WorkspaceLayout from './components/layout/WorkspaceLayout'
import ChatPage from './features/chat/ChatPage'
import SearchPage from './features/search/SearchPage'
import ChunksPage from './features/chunks/ChunksPage'

/**
 * Cross-fades /login, /register and the app. Everything inside the app shares one key,
 * so switching views never remounts the shell.
 */
function AnimatedRoutes() {
  const location = useLocation()
  const group = location.pathname === '/login' || location.pathname === '/register' ? location.pathname : 'app'
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={group}
        className="h-full"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <Routes location={location}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<WorkspaceLayout />}>
              <Route index element={<ChatPage />} />
              <Route path="c/:conversationId" element={<ChatPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="chunks" element={<ChunksPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <>
      <AnimatedRoutes />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#0e1426', color: '#e2e8f0', border: '1px solid #1e293b', fontSize: '14px' },
        }}
      />
    </>
  )
}
