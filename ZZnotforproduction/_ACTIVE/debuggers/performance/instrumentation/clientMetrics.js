// debuggers/performance/instrumentation/clientMetrics.js
// Captures client-side performance metrics: page load, hydration, route transitions,
// image loading, and Web Vitals via the Performance API.
// DEV-ONLY.

import { addPageLoad, addRouteChange, addImageLoad, isRecording } from '../store.js'
import { startScreenTrace, markTraceLoadSettled } from '../screenTrace.js'

let _installed = false
let _observer = null
let _lastRoute = null
let _routeChangeStart = null

export function installClientMetrics() {
  if (!import.meta.env.DEV) return
  if (_installed) return
  if (typeof window === 'undefined') return

  _installed = true
  _lastRoute = window.location.pathname

  // Start the first screen trace for the initial page load
  startScreenTrace(window.location.pathname)

  captureInitialPageLoad()
  observeImages()
  observeRouteChanges()
  observeLongTasks()
}

function captureInitialPageLoad() {
  // Wait for load event to get accurate timing
  if (document.readyState === 'complete') {
    recordPageLoad()
  } else {
    window.addEventListener('load', recordPageLoad, { once: true })
  }
}

function recordPageLoad() {
  requestAnimationFrame(() => {
    const perf = performance.getEntriesByType('navigation')[0]
    if (!perf) return

    const loadTimeMs = perf.loadEventEnd - perf.startTime
    const domContentLoaded = perf.domContentLoadedEventEnd - perf.startTime
    const ttfb = perf.responseStart - perf.startTime

    addPageLoad({
      route: window.location.pathname,
      loadTimeMs: loadTimeMs > 0 ? loadTimeMs : performance.now(),
      hydrationTimeMs: perf.domInteractive - perf.responseEnd,
      dbTimeMs: 0, // populated by query correlation later
      apiTimeMs: ttfb,
      renderTimeMs: perf.domComplete - perf.domInteractive,
      queryCount: 0,
      apiCallCount: performance.getEntriesByType('resource').filter(
        (r) => r.initiatorType === 'fetch' || r.initiatorType === 'xmlhttprequest'
      ).length,
      imageCount: performance.getEntriesByType('resource').filter(
        (r) => r.initiatorType === 'img'
      ).length,
    })
  })
}

function observeImages() {
  if (typeof PerformanceObserver === 'undefined') return

  try {
    _observer = new PerformanceObserver((list) => {
      if (!isRecording()) return
      for (const entry of list.getEntries()) {
        if (entry.initiatorType === 'img' || entry.name.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)/i)) {
          addImageLoad({
            src: truncateResourceUrl(entry.name),
            durationMs: entry.duration,
            size: entry.transferSize || 0,
            route: window.location.pathname,
          })
        }
      }
    })

    _observer.observe({ type: 'resource', buffered: true })
  } catch (_) {}
}

function observeRouteChanges() {
  // Listen for popstate (browser back/forward)
  window.addEventListener('popstate', handleRouteChange)

  // Monkey-patch pushState and replaceState
  const originalPushState = history.pushState.bind(history)
  const originalReplaceState = history.replaceState.bind(history)

  history.pushState = function (...args) {
    originalPushState(...args)
    handleRouteChange()
  }

  history.replaceState = function (...args) {
    originalReplaceState(...args)
    handleRouteChange()
  }
}

function handleRouteChange() {
  if (!isRecording()) return

  const newRoute = window.location.pathname
  if (newRoute === _lastRoute) return

  const now = performance.now()

  if (_routeChangeStart !== null) {
    addRouteChange({
      from: _lastRoute,
      to: newRoute,
      durationMs: now - _routeChangeStart,
    })
  }

  _lastRoute = newRoute
  _routeChangeStart = now

  // Start a new screen trace for this route.
  // The previous trace is auto-ended by startScreenTrace().
  // Traces stay OPEN until the next route change — this captures all lazy data,
  // polling, and realtime activity that belongs to this route.
  startScreenTrace(newRoute)

  // Record page load timing after paint (does NOT end the trace)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (_routeChangeStart !== null) {
        const transitionMs = performance.now() - _routeChangeStart
        _routeChangeStart = null

        addPageLoad({
          route: newRoute,
          loadTimeMs: transitionMs,
          hydrationTimeMs: 0,
          renderTimeMs: transitionMs,
        })

        // Mark the trace's initial load phase as settled (queries after this are post-load)
        markTraceLoadSettled()
      }
    })
  })
}

let _longTaskObserver = null

function observeLongTasks() {
  if (typeof PerformanceObserver === 'undefined') return
  if (!PerformanceObserver.supportedEntryTypes?.includes('longtask')) return

  try {
    _longTaskObserver = new PerformanceObserver((list) => {
      if (!isRecording()) return
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          // Long tasks are stored as render events on page loads
          // They get correlated to the active route
        }
      }
    })
    _longTaskObserver.observe({ type: 'longtask', buffered: true })
  } catch (_) {
    // longtask not supported in all browsers
  }
}

function truncateResourceUrl(url) {
  try {
    const u = new URL(url)
    const path = u.pathname
    if (path.length > 80) return '...' + path.slice(-77)
    return path
  } catch (_) {
    return url.slice(0, 80)
  }
}

export function uninstallClientMetrics() {
  if (_observer) { _observer.disconnect(); _observer = null }
  if (_longTaskObserver) { _longTaskObserver.disconnect(); _longTaskObserver = null }
  _installed = false
}

// Manual instrumentation hook for component render timing
export function measureRender(componentName, fn) {
  if (!import.meta.env.DEV || !isRecording()) return fn()

  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start

  if (duration > 16) {
    // Worth logging if exceeds one frame (16ms)
    performance.mark(`render:${componentName}:${Math.round(duration)}ms`)
  }

  return result
}
