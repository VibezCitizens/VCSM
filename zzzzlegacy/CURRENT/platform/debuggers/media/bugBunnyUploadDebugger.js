// zNOTFORPRODUCTION/debuggers/media/bugBunnyUploadDebugger.js
// ============================================================
// BugBunny Upload Debugger — DEV ONLY
// Traces the full upload pipeline across all 13 scopes.
// Imported via @debuggers alias which resolves to no-ops in production.
// ============================================================

const RING_SIZE = 100
const PREFIX = '🐰 BugBunny Upload'

const _ring = []
let _enabled = null

function isEnabled() {
  if (_enabled !== null) return _enabled
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      _enabled = true
      return true
    }
    const url = typeof window !== 'undefined' && window.location?.search
    if (url && new URLSearchParams(url).get('debugUploads') === '1') {
      _enabled = true
      return true
    }
    if (typeof localStorage !== 'undefined' && localStorage.getItem('DEBUG_UPLOADS') === '1') {
      _enabled = true
      return true
    }
  } catch {
    // SSR / non-browser context
  }
  _enabled = false
  return false
}

function redactTokens(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase()
    if (lower.includes('token') || lower.includes('authorization') || lower.includes('apikey') || lower.includes('secret')) {
      out[k] = '[REDACTED]'
    } else if (v && typeof v === 'object') {
      out[k] = redactTokens(v)
    } else {
      out[k] = v
    }
  }
  return out
}

function push(event) {
  if (_ring.length >= RING_SIZE) _ring.shift()
  _ring.push(event)
}

/**
 * Log a pipeline step.
 * @param {string} scope  — upload scope key (e.g. 'vibe_post', 'chat_attachment')
 * @param {string} step   — step label (e.g. 'upload:start', 'media_asset:inserted')
 * @param {object} [payload]
 */
export function bugBunnyUploadStep(scope, step, payload = {}) {
  if (!isEnabled()) return
  const event = { ts: Date.now(), type: 'step', scope, step, payload: redactTokens(payload) }
  push(event)
  console.log(`${PREFIX} [${scope}] ${step}`, event.payload)
}

/**
 * Log a pipeline error (non-fatal or fatal).
 * @param {string} scope
 * @param {string} step
 * @param {Error|unknown} error
 * @param {object} [payload]
 */
export function bugBunnyUploadError(scope, step, error, payload = {}) {
  if (!isEnabled()) return
  const event = {
    ts: Date.now(),
    type: 'error',
    scope,
    step,
    error: error?.message ?? String(error),
    payload: redactTokens(payload),
  }
  push(event)
  console.warn(`${PREFIX} [${scope}] ERROR at ${step}:`, event.error, event.payload)
}

/**
 * Return a copy of the ring buffer for inspection.
 * @returns {Array<object>}
 */
export function getBugBunnyUploadEvents() {
  return [..._ring]
}

/**
 * Clear the ring buffer (useful before a test run).
 */
export function clearBugBunnyUploadEvents() {
  _ring.length = 0
}
