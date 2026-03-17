import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * React Error Boundary — catches render errors in child components
 * and displays a friendly fallback instead of crashing the whole page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // In production: send to error reporting service
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-status-offline/10">
            <AlertTriangle className="h-6 w-6 text-status-offline" />
          </div>
          <h3 className="text-sm font-semibold text-gray-200">Something went wrong</h3>
          <p className="mt-1 max-w-sm text-xs text-gray-500">
            An unexpected error occurred while rendering this page.
            Try refreshing, or go back to the dashboard.
          </p>
          {this.state.error?.message && (
            <pre className="mt-3 max-w-md overflow-x-auto rounded-lg bg-surface-800 px-3 py-2 text-[10px] text-gray-600">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            className="mt-4 flex items-center gap-2 rounded-lg bg-surface-800 px-4 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-surface-700 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
