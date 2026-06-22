import { Component } from 'react'
import { captureMonitoringError } from '@/services/monitoring/monitoring'

// Browser/Vite messages emitted when a lazy chunk (dynamic import) fails to load.
// This is the production-only failure mode behind "Page unavailable": a client
// running a stale app shell (cached by the PWA service worker / CDN) requests a
// chunk hash that no longer exists on the freshly-deployed origin. The Cloudflare
// `/* /index.html 200` SPA fallback then returns index.html for the .js request,
// so the import either 404s or tries to parse HTML as a module and throws.
const CHUNK_LOAD_ERROR_RE =
  /dynamically imported module|importing a module script failed|unable to preload|chunkloaderror|unexpected token '<'|failed to fetch/i

const RELOAD_GUARD_KEY = 'vcsm:route-chunk-reload-at'
const RELOAD_GUARD_WINDOW_MS = 10_000

function isChunkLoadError(error) {
  return CHUNK_LOAD_ERROR_RE.test(`${error?.name || ''} ${error?.message || ''}`)
}

// Reload at most once per window. A successful reload (fresh shell + correct
// chunk hashes) produces no further error, so no loop. A genuinely missing
// chunk re-throws inside the window and falls through to the manual Refresh UI.
function shouldAutoReloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0)
    const now = Date.now()
    if (now - last < RELOAD_GUARD_WINDOW_MS) return false
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(now))
    return true
  } catch {
    return false
  }
}

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

    // Self-heal stale-shell chunk-load failures by reloading once so the client
    // picks up the freshly-deployed shell and chunk hashes. Render errors (which
    // do not match the chunk-load signature) are left to the manual Refresh UI.
    if (isChunkLoadError(error) && shouldAutoReloadOnce()) {
      window.location.reload()
    }
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
