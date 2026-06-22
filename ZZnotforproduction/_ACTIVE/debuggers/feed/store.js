// debuggers/feed/store.js
// ============================================================
// Feed Debug Store
// DEV-ONLY. Tracks feed queries, visibility decisions, and render pipeline.
// Persists to sessionStorage for navigation survival.
// ============================================================

import { onDebugUserChange, registerDebugCollector } from '../cycle.js'

const STORAGE_KEY = 'vcsm.debug.feed'
const MAX_EVENTS = 80

let _events = []
let _viewerSnapshot = null
let _feedSnapshot = null
let _postDecisions = []
let _listeners = new Set()

// Clear current snapshots when auth user changes
onDebugUserChange(() => {
  _viewerSnapshot = null
  _feedSnapshot = null
  _postDecisions = []
  persist()
  notify()
})

registerDebugCollector('feed', () => ({
  viewer: _viewerSnapshot,
  feed: _feedSnapshot,
  decisions: _postDecisions.slice(0, 10),
}))
let _hydrated = false
let _idCounter = 0

function hydrate() {
  if (_hydrated) return
  _hydrated = true
  if (!import.meta.env.DEV) return
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      _events = parsed.events ?? []
      _viewerSnapshot = parsed.viewer ?? null
      _feedSnapshot = parsed.feed ?? null
      _postDecisions = parsed.decisions ?? []
      _idCounter = _events.reduce((m, e) => Math.max(m, e.id || 0), 0)
    }
  } catch (_) {}
}

function persist() {
  if (!import.meta.env.DEV) return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      events: _events,
      viewer: _viewerSnapshot,
      feed: _feedSnapshot,
      decisions: _postDecisions,
    }))
  } catch (_) {}
}

function notify() {
  for (const fn of _listeners) {
    try { fn() } catch (_) {}
  }
}

export function addFeedDebugEvent({ step, status = 'info', message = '', payload = null }) {
  if (!import.meta.env.DEV) return
  hydrate()
  _idCounter++
  _events = [{ id: _idCounter, at: new Date().toISOString(), step, status, message, payload }, ..._events].slice(0, MAX_EVENTS)
  persist()
  notify()
}

export function setFeedViewerSnapshot(viewer) {
  if (!import.meta.env.DEV) return
  hydrate()
  _viewerSnapshot = viewer
  persist()
  notify()
}

export function setFeedSnapshot(feed) {
  if (!import.meta.env.DEV) return
  hydrate()
  _feedSnapshot = feed
  persist()
  notify()
}

export function setPostDecisions(decisions) {
  if (!import.meta.env.DEV) return
  hydrate()
  _postDecisions = decisions
  persist()
  notify()
}

export function clearFeedDebugState() {
  _events = []
  _viewerSnapshot = null
  _feedSnapshot = null
  _postDecisions = []
  _idCounter = 0
  try { sessionStorage.removeItem(STORAGE_KEY) } catch (_) {}
  notify()
}

export function getFeedDebugState() {
  hydrate()
  return {
    events: _events,
    viewer: _viewerSnapshot,
    feed: _feedSnapshot,
    decisions: _postDecisions,
  }
}

export function subscribeFeedDebug(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}
