import { Component, type ErrorInfo, type ReactNode } from 'react'
import clsx from 'clsx'
import { RotateCcw } from 'lucide-react'
import BrandMark from './BrandMark'

interface Props {
  children: ReactNode
  /** a change in this value (e.g. the route) clears a shown error */
  resetKey?: unknown
  /** render inside the app shell (header and sidebar stay usable) instead of full screen */
  compact?: boolean
}

interface State {
  error: Error | null
}

/** Catches render errors and shows a recoverable screen instead of a blank page. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div role="alert" className={clsx('flex flex-col items-center justify-center px-6 text-center', this.props.compact ? 'flex-1 py-16' : 'min-h-full py-24')}>
        <BrandMark size="lg" />
        <h1 className="mt-6 text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
          This screen hit an unexpected error. Your documents and chats are safe. Try again, or reload the page.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => this.setState({ error: null })}
            className="flex items-center gap-2 rounded-xl bg-brand-strong px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            <RotateCcw size={15} /> Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Reload page
          </button>
        </div>
        <details className="mt-6 max-w-lg text-left text-xs text-slate-600 dark:text-slate-400">
          <summary className="cursor-pointer rounded px-1 text-center">Technical details</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-100 p-3 font-mono dark:bg-slate-900">{error.message}</pre>
        </details>
      </div>
    )
  }
}
