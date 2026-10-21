import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App'
import ErrorBoundary from './components/ui/ErrorBoundary'

// Router basename = Vite base without the trailing slash, so /login resolves to /docmind/login.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* reducedMotion="user": animations follow the OS reduce-motion setting */}
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </MotionConfig>
  </StrictMode>,
)
