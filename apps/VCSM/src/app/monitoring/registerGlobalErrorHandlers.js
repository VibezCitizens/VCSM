import { captureFrontendError } from '@/services/monitoring/monitoringClient'

let _registered = false

export function registerGlobalErrorHandlers() {
  if (_registered) return
  _registered = true

  window.addEventListener('error', (event) => {
    try {
      const error = event.error instanceof Error
        ? event.error
        : new Error(event.message ?? 'Unknown error')

      captureFrontendError(error, {
        feature:    'app',
        module:     'globalErrorHandler',
        controller: 'window.onerror',
        route:      window.location.pathname,
        tags:       { source: 'window_error' },
        context: {
          filename: event.filename,
          lineno:   event.lineno,
          colno:    event.colno,
        },
      })
    } catch {
      // Never throw from an error handler
    }
  })

  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason
      let error
      if (reason instanceof Error) {
        error = reason
      } else if (typeof reason === 'string') {
        error = new Error(reason)
      } else if (reason !== null && reason !== undefined) {
        error = new Error(`Unhandled rejection: [${reason?.constructor?.name ?? 'object'}]`)
      } else {
        error = new Error('Unhandled promise rejection')
      }

      captureFrontendError(error, {
        feature:    'app',
        module:     'globalErrorHandler',
        controller: 'window.unhandledrejection',
        route:      window.location.pathname,
        tags:       { source: 'unhandled_rejection' },
      })
    } catch {
      // Never throw from a rejection handler
    }
  })
}
