// debuggers/global/store.js
// ============================================================
// Global Identity Audit Store — DEV-ONLY
// Combines auth + identity + platform truth in one place.
// ============================================================

import { onDebugUserChange, registerDebugCollector } from '../cycle.js'

const STORAGE_KEY = 'vcsm.debug.global'

let _snapshot = null
let _dbTruth = null
let _nullReason = null
let _listeners = new Set()
let _hydrated = false

// Clear everything when auth user changes
onDebugUserChange(() => {
  _snapshot = null
  _dbTruth = null
  _nullReason = null
  _hydrated = false
  try { sessionStorage.removeItem(STORAGE_KEY) } catch (_) {}
  notify()
})

registerDebugCollector('global', () => ({
  snapshot: _snapshot,
  dbTruth: _dbTruth ? { fetchedAt: _dbTruth.fetchedAt, hasAccount: !!_dbTruth.account } : null,
  nullReason: _nullReason,
}))

function hydrate() {
  if (_hydrated) return
  _hydrated = true
  if (!import.meta.env.DEV) return
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      _snapshot = p.snapshot ?? null
      _dbTruth = p.dbTruth ?? null
      _nullReason = p.nullReason ?? null
    }
  } catch (_) {}
}

function persist() {
  if (!import.meta.env.DEV) return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      snapshot: _snapshot,
      dbTruth: _dbTruth,
      nullReason: _nullReason,
    }))
  } catch (_) {}
}

function notify() {
  for (const fn of _listeners) { try { fn() } catch (_) {} }
}

export function setGlobalSnapshot(snap) {
  if (!import.meta.env.DEV) return
  hydrate()
  _snapshot = snap
  if (snap?.status === 'OK') {
    _nullReason = null
  }
  persist()
  notify()
}

export function setDbTruth(truth) {
  if (!import.meta.env.DEV) return
  hydrate()
  _dbTruth = truth
  persist()
  notify()
}

export function setNullIdentityReason(reason) {
  if (!import.meta.env.DEV) return
  hydrate()
  _nullReason = reason
  persist()
  notify()
}

export function clearGlobalDebug() {
  _snapshot = null
  _dbTruth = null
  _nullReason = null
  try { sessionStorage.removeItem(STORAGE_KEY) } catch (_) {}
  notify()
}

export function getGlobalDebugState() {
  hydrate()
  return { snapshot: _snapshot, dbTruth: _dbTruth, nullReason: _nullReason }
}

export function subscribeGlobalDebug(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}
