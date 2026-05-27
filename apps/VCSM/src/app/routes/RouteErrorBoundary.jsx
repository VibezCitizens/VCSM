import { Component } from 'react'
import { captureMonitoringError } from '@/services/monitoring/monitoring'

/**
 * Catches errors thrown during lazy-chunk loading or route render.
 * Must be a class component — React error boundaries cannot be function components.
 * Must wrap OUTSIDE <Suspense> so it catches both lazy load failures and render errors.
 */
export class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('[RouteErrorBoundary] Chunk load error:', error, info)
    }
    captureMonitoringError(error, { componentStack: info?.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
            Page unavailable. Please refresh and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#7c3aed',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
