import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 bg-ios-grouped-light p-8 text-center dark:bg-ios-grouped-dark">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ios-red-light/15 dark:bg-ios-red-dark/25">
            <AlertTriangle
              className="h-7 w-7 text-ios-red-light dark:text-ios-red-dark"
              strokeWidth={2.2}
            />
          </div>
          <div>
            <p className="text-[17px] font-semibold text-ios-label-light dark:text-ios-label-dark">
              Something went wrong
            </p>
            <p className="mt-1 text-[13px] text-ios-secondary_label-light dark:text-ios-secondary_label-dark">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="ios-press mt-1 inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-ios-blue-light px-4 text-[14px] font-medium text-white active:bg-ios-blue-light/85 dark:bg-ios-blue-dark"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.5} />
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
