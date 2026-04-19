const ENABLE_KEY = '__vcsm_ios_dbg'
const LEGACY_ENABLE_KEY = '__vcsm_dbg'
const LOGS_KEY = '__vcsm_ios_dbg_logs'
const MAX_LOGS = 500

export const IOS_PROD_DEBUG_EVENTS = Object.freeze({
  entry: 'vcsm:ios-debug-log-entry',
  clear: 'vcsm:ios-debug-log-clear',
  toggle: 'vcsm:ios-debug-toggle',
})

function hasWindow() {
  return typeof window !== 'undefined'
}

function hasDocument() {
  return typeof document !== 'undefined'
}

function safeParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function sanitize(value, depth = 0) {
  if (depth > 4) return '[max-depth]'
  if (value == null) return value

  const t = typeof value
  if (t === 'string' || t === 'number' || t === 'boolean') return value
  if (t === 'bigint') return String(value)
  if (t === 'function') return '[function]'
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack ?? null,
    }
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitize(item, depth + 1))
  }

  if (t === 'object') {
    const out = {}
    Object.entries(value).slice(0, 100).forEach(([k, v]) => {
      out[k] = sanitize(v, depth + 1)
    })
    return out
  }

  return String(value)
}

function readDisplayMode() {
  if (!hasWindow()) return 'unknown'
  const standaloneMedia = window.matchMedia?.('(display-mode: standalone)')?.matches
  const iosStandalone = window.navigator?.standalone === true
  return standaloneMedia || iosStandalone ? 'standalone' : 'browser'
}

const state = {
  loaded: false,
  seq: 0,
  logs: [],
}

function ensureLoaded() {
  if (state.loaded || !hasWindow()) return
  state.loaded = true

  let seed = []
  try {
    const raw = window.sessionStorage?.getItem(LOGS_KEY)
    if (raw) {
      const parsed = safeParse(raw, [])
      if (Array.isArray(parsed)) seed = parsed
    }
  } catch {
    seed = []
  }

  state.logs = seed.slice(-MAX_LOGS)
  const maxId = state.logs.reduce((m, row) => {
    const id = Number(row?.id || 0)
    return Number.isFinite(id) && id > m ? id : m
  }, 0)
  state.seq = maxId
}

function persistLogs() {
  if (!hasWindow()) return
  try {
    window.sessionStorage?.setItem(LOGS_KEY, JSON.stringify(state.logs))
  } catch {
    // Ignore storage quota / private mode errors.
  }
}

function emit(name, detail) {
  if (!hasWindow()) return
  try {
    window.dispatchEvent(new CustomEvent(name, { detail }))
  } catch {
    // Ignore event dispatch errors.
  }
}

function parseToggleValue(raw) {
  if (raw == null) return null
  const v = String(raw).trim().toLowerCase()
  if (v === '1' || v === 'true' || v === 'on' || v === 'yes') return true
  if (v === '0' || v === 'false' || v === 'off' || v === 'no') return false
  return null
}

export function isIOSProdDebuggerEnabled() {
  if (!hasWindow()) return false
  try {
    return (
      window.localStorage?.getItem(ENABLE_KEY) === '1' ||
      window.localStorage?.getItem(LEGACY_ENABLE_KEY) === '1'
    )
  } catch {
    return false
  }
}

export function setIOSProdDebuggerEnabled(enabled) {
  if (!hasWindow()) return
  try {
    if (enabled) window.localStorage?.setItem(ENABLE_KEY, '1')
    else {
      window.localStorage?.removeItem(ENABLE_KEY)
      window.localStorage?.removeItem(LEGACY_ENABLE_KEY)
    }
  } catch {
    // Ignore localStorage errors.
  }

  emit(IOS_PROD_DEBUG_EVENTS.toggle, { enabled: !!enabled })
}

export function bootstrapIOSProdDebuggerFromUrl(search = null) {
  if (!hasWindow()) return false

  let params = null
  try {
    params = new URLSearchParams(search ?? window.location.search ?? '')
  } catch {
    return false
  }

  const toggleRaw =
    params.get('iosdbg') ??
    params.get('__vcsm_ios_dbg') ??
    params.get('vcsm_ios_dbg')

  const toggled = parseToggleValue(toggleRaw)
  if (toggled == null) return false

  setIOSProdDebuggerEnabled(toggled)
  if (toggled) {
    appendIOSProdDebugLog('debug_enabled_from_query', {
      source: 'bootstrapIOSProdDebuggerFromUrl',
      toggleRaw,
      search: search ?? window.location.search ?? '',
    })
  }
  return true
}

export function clearIOSProdDebugLogs() {
  ensureLoaded()
  state.logs = []
  state.seq = 0
  persistLogs()
  emit(IOS_PROD_DEBUG_EVENTS.clear, { at: new Date().toISOString() })
}

export function getIOSProdDebugLogs() {
  ensureLoaded()
  return state.logs.slice()
}

export function getIOSProdDebugMeta() {
  if (!hasWindow()) {
    return {
      origin: null,
      href: null,
      displayMode: 'unknown',
      online: null,
      userAgent: null,
      swController: null,
    }
  }

  return {
    origin: window.location.origin,
    href: window.location.href,
    path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    displayMode: readDisplayMode(),
    online: window.navigator?.onLine ?? null,
    userAgent: window.navigator?.userAgent ?? null,
    swController: window.navigator?.serviceWorker?.controller?.scriptURL ?? null,
    visible: hasDocument() ? document.visibilityState : null,
  }
}

export function appendIOSProdDebugLog(event, payload = null) {
  if (!isIOSProdDebuggerEnabled()) return null

  ensureLoaded()

  const entry = {
    id: ++state.seq,
    at: new Date().toISOString(),
    event,
    ...getIOSProdDebugMeta(),
    payload: sanitize(payload),
  }

  state.logs.push(entry)
  if (state.logs.length > MAX_LOGS) {
    state.logs.splice(0, state.logs.length - MAX_LOGS)
  }

  persistLogs()
  emit(IOS_PROD_DEBUG_EVENTS.entry, entry)
  return entry
}
