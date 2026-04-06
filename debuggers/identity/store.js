// debuggers/identity/store.js
// ============================================================
// Identity Debug Store
// DEV-ONLY. All functions are no-ops in production.
// Events persist to sessionStorage to survive lazy-load race.
// ============================================================

import { onDebugUserChange, registerDebugCollector } from '../cycle.js'

const STORAGE_KEY = 'vcsm.debug.identity.events'
const SNAPSHOT_KEY = 'vcsm.debug.identity.snapshots'
const MAX_EVENTS = 100

let _events = []
let _sessionSnapshot = null
let _identitySnapshot = null
let _listeners = new Set()
let _idCounter = 0
let _hydrated = false

// Clear current snapshots when auth user changes (keep event history)
onDebugUserChange(() => {
  _sessionSnapshot = null
  _identitySnapshot = null
  persistToStorage()
  notify()
})

registerDebugCollector('identity', () => ({
  events: _events.slice(0, 20),
  sessionSnapshot: _sessionSnapshot,
  identitySnapshot: _identitySnapshot,
}))

// ---- SessionStorage persistence (survives lazy-load race) ----

function hydrateFromStorage() {
  if (_hydrated) return
  _hydrated = true
  if (!import.meta.env.DEV) return

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        _events = parsed
        _idCounter = parsed.reduce((max, e) => Math.max(max, e.id || 0), 0)
      }
    }

    const snaps = sessionStorage.getItem(SNAPSHOT_KEY)
    if (snaps) {
      const parsed = JSON.parse(snaps)
      _sessionSnapshot = parsed.session ?? null
      _identitySnapshot = parsed.identity ?? null
    }
  } catch (_) {}
}

function persistToStorage() {
  if (!import.meta.env.DEV) return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(_events))
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
      session: _sessionSnapshot,
      identity: _identitySnapshot,
    }))
  } catch (_) {}
}

// ---- Notification ----

function notify() {
  _listeners.forEach((fn) => {
    try { fn() } catch (_) {}
  })
}

// ---- Public API ----

export function isIdentityDebugEnabled() {
  if (!import.meta.env.DEV) return false
  return true
}

export function addIdentityDebugEvent({
  step,
  phase = 'login',
  status = 'info',
  message = '',
  payload = null,
  error = null,
  durationMs = null,
}) {
  if (!import.meta.env.DEV) return
  hydrateFromStorage()

  _idCounter++
  const event = {
    id: _idCounter,
    at: new Date().toISOString(),
    step,
    phase,
    status,
    message,
    payload,
    error: error
      ? { code: error?.code, message: error?.message ?? String(error) }
      : null,
    durationMs,
  }

  _events = [event, ..._events].slice(0, MAX_EVENTS)
  persistToStorage()
  notify()
}

export function setSessionSnapshot(data) {
  if (!import.meta.env.DEV) return
  hydrateFromStorage()
  _sessionSnapshot = data
  persistToStorage()
  notify()
}

export function setIdentitySnapshot(data) {
  if (!import.meta.env.DEV) return
  hydrateFromStorage()
  _identitySnapshot = data
  persistToStorage()
  notify()
}

export function clearIdentityDebugEvents() {
  _events = []
  _sessionSnapshot = null
  _identitySnapshot = null
  _idCounter = 0
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(SNAPSHOT_KEY)
  } catch (_) {}
  notify()
}

export function getIdentityDebugState() {
  hydrateFromStorage()
  return {
    enabled: isIdentityDebugEnabled(),
    events: _events,
    sessionSnapshot: _sessionSnapshot,
    identitySnapshot: _identitySnapshot,
  }
}

export function subscribeIdentityDebug(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}
