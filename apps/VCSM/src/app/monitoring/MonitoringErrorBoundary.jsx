import React from 'react'
import { captureFrontendError } from '@/services/monitoring/monitoringClient'

export default class MonitoringErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    captureFrontendError(error, {
      feature:     'app',
      module:      'MonitoringErrorBoundary',
      controller:  'react_error_boundary',
      route:       window.location.pathname,
      tags:        { source: 'react' },
      context:     { componentStack: errorInfo?.componentStack || null },
      breadcrumbs: [{ type: 'react', message: 'component_crash' }],
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
          <p className="text-base font-medium mb-2">Something went wrong.</p>
          <p className="text-sm text-white/50 mb-6">Please reload the page and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm"
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
