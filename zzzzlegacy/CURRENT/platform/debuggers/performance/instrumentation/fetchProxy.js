// debuggers/performance/instrumentation/fetchProxy.js
// Wraps window.fetch to capture API request timing, sizes, and correlation.
// DEV-ONLY. Filters out non-app requests (e.g. HMR, extensions).

import { addApiRequest, isRecording } from '../store.js'
import { getActiveContext } from './requestContext.js'

let _installed = false
let _originalFetch = null

const IGNORE_PATTERNS = [
  '/@vite',
  '/__vite',
  '/node_modules/',
  'hot-update',
  'chrome-extension',
  'moz-extension',
  'localhost:5173/__',
]

function shouldIgnore(url) {
  const urlStr = typeof url === 'string' ? url : url?.url ?? ''
  return IGNORE_PATTERNS.some((p) => urlStr.includes(p))
}

function extractUrl(input) {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  if (input instanceof Request) return input.url
  return String(input)
}

function isSupabaseRequest(url) {
  return url.includes('supabase') || url.includes('/rest/v1/') || url.includes('/auth/v1/')
}

export function installFetchProxy() {
  if (!import.meta.env.DEV) return
  if (_installed) return
  if (typeof window === 'undefined') return

  _installed = true
  _originalFetch = window.fetch.bind(window)

  window.fetch = async function proxiedFetch(input, init) {
    const url = extractUrl(input)

    if (shouldIgnore(url) || !isRecording()) {
      return _originalFetch(input, init)
    }

    const method = init?.method ?? (input instanceof Request ? input.method : 'GET')
    const startTime = performance.now()
    const ctx = getActiveContext()

    let response
    let error = null

    try {
      response = await _originalFetch(input, init)
    } catch (err) {
      error = err
      const durationMs = performance.now() - startTime

      addApiRequest({
        url: truncateUrl(url),
        method,
        durationMs,
        status: 0,
        responseSize: 0,
        requestId: ctx?.id ?? null,
        route: ctx?.route ?? window.location.pathname,
        error,
      })

      throw err
    }

    const durationMs = performance.now() - startTime
    const contentLength = response.headers.get('content-length')
    const responseSize = contentLength ? parseInt(contentLength, 10) : 0

    // Skip logging Supabase REST requests (already captured by supabaseProxy)
    if (!isSupabaseRequest(url)) {
      addApiRequest({
        url: truncateUrl(url),
        method,
        durationMs,
        status: response.status,
        responseSize,
        requestId: ctx?.id ?? null,
        route: ctx?.route ?? window.location.pathname,
      })
    }

    return response
  }
}

function truncateUrl(url) {
  try {
    const u = new URL(url, window.location.origin)
    return u.pathname + (u.search ? u.search.slice(0, 80) : '')
  } catch (_) {
    return url.slice(0, 120)
  }
}

export function uninstallFetchProxy() {
  if (!_installed || !_originalFetch) return
  window.fetch = _originalFetch
  _originalFetch = null
  _installed = false
}
