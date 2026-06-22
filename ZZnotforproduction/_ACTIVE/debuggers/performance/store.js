// debuggers/performance/store.js
// Central performance event store.
// DEV-ONLY. Plain JS with manual subscriptions (matches identity debugger pattern).
// Persists to sessionStorage to survive HMR.

import { registerDebugCollector } from '../cycle.js'
import { MAX_EVENTS, MAX_QUERIES, MAX_REQUESTS, THRESHOLDS, SEVERITY } from './constants.js'
import { attachQueryToTrace, attachApiToTrace, attachImageToTrace } from './screenTrace.js'

const STORAGE_KEY = 'vcsm.debug.perf.events'

let _dbQueries = []
let _apiRequests = []
let _pageLoads = []
let _routeChanges = []
let _seq = 0
let _imageLoads = []
let _listeners = new Set()
let _hydrated = false
let _recording = true

registerDebugCollector('performance', () => ({
  dbQueries: _dbQueries.length,
  apiRequests: _apiRequests.length,
  pageLoads: _pageLoads.length,
  recording: _recording,
}))

function notify() {
  bumpSnapshotVersion()
  for (const fn of _listeners) {
    try { fn() } catch (_) {}
  }
}

function hydrateFromStorage() {
  if (_hydrated) return
  _hydrated = true
  if (!import.meta.env.DEV) return
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      _dbQueries = parsed.dbQueries ?? []
      _apiRequests = parsed.apiRequests ?? []
      _pageLoads = parsed.pageLoads ?? []
      _routeChanges = parsed.routeChanges ?? []
      _imageLoads = parsed.imageLoads ?? []
    }
  } catch (_) {}
}

function persist() {
  if (!import.meta.env.DEV) return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      dbQueries: _dbQueries.slice(0, 200),
      apiRequests: _apiRequests.slice(0, 100),
      pageLoads: _pageLoads.slice(0, 50),
      routeChanges: _routeChanges.slice(0, 50),
      imageLoads: _imageLoads.slice(0, 100),
    }))
  } catch (_) {}
}

function classifySeverity(durationMs, warningMs, criticalMs) {
  if (durationMs >= criticalMs) return SEVERITY.CRITICAL
  if (durationMs >= warningMs) return SEVERITY.WARNING
  return SEVERITY.OK
}

// --- Public API ---

export function isRecording() { return _recording }
export function setRecording(val) { _recording = val; notify() }
export function toggleRecording() { _recording = !_recording; notify() }

export function addDbQuery({
  queryName,
  table,
  schema = 'vc',
  method = 'select',
  durationMs,
  rowCount = 0,
  columns = [],
  payloadSize = 0,
  requestId = null,
  route = null,
  duplicateOf = null,
  error = null,
}) {
  if (!import.meta.env.DEV || !_recording) return
  hydrateFromStorage()

  const entry = {
    id: `dbq_${Date.now()}_${++_seq}`,
    timestamp: new Date().toISOString(),
    at: performance.now(),
    queryName,
    table: schema ? `${schema}.${table}` : table,
    method,
    durationMs: Math.round(durationMs * 100) / 100,
    rowCount,
    columns,
    columnCount: columns.length,
    payloadSize,
    requestId,
    route,
    duplicateOf,
    error: error ? { message: error.message ?? String(error), code: error.code } : null,
    severity: classifySeverity(durationMs, THRESHOLDS.QUERY_WARNING_MS, THRESHOLDS.QUERY_CRITICAL_MS),
  }

  _dbQueries = [entry, ..._dbQueries].slice(0, MAX_QUERIES)
  attachQueryToTrace(entry)
  persist()
  notify()
  return entry
}

export function addApiRequest({
  url,
  method = 'GET',
  durationMs,
  status,
  responseSize = 0,
  dbDurationMs = 0,
  queryCount = 0,
  requestId = null,
  route = null,
  error = null,
}) {
  if (!import.meta.env.DEV || !_recording) return
  hydrateFromStorage()

  const entry = {
    id: `api_${Date.now()}_${_apiRequests.length}`,
    timestamp: new Date().toISOString(),
    at: performance.now(),
    url,
    method,
    durationMs: Math.round(durationMs * 100) / 100,
    status,
    responseSize,
    dbDurationMs,
    queryCount,
    requestId,
    route,
    error: error ? { message: error.message ?? String(error) } : null,
    severity: classifySeverity(durationMs, THRESHOLDS.API_WARNING_MS, THRESHOLDS.API_CRITICAL_MS),
  }

  _apiRequests = [entry, ..._apiRequests].slice(0, MAX_REQUESTS)
  attachApiToTrace(entry)
  persist()
  notify()
  return entry
}

export function addPageLoad({
  route,
  loadTimeMs,
  hydrationTimeMs = 0,
  dbTimeMs = 0,
  apiTimeMs = 0,
  renderTimeMs = 0,
  queryCount = 0,
  apiCallCount = 0,
  imageCount = 0,
  requestId = null,
}) {
  if (!import.meta.env.DEV || !_recording) return
  hydrateFromStorage()

  const entry = {
    id: `pl_${Date.now()}_${_pageLoads.length}`,
    timestamp: new Date().toISOString(),
    route,
    loadTimeMs: Math.round(loadTimeMs * 100) / 100,
    hydrationTimeMs: Math.round(hydrationTimeMs * 100) / 100,
    dbTimeMs: Math.round(dbTimeMs * 100) / 100,
    apiTimeMs: Math.round(apiTimeMs * 100) / 100,
    renderTimeMs: Math.round(renderTimeMs * 100) / 100,
    queryCount,
    apiCallCount,
    imageCount,
    requestId,
    severity: classifySeverity(loadTimeMs, THRESHOLDS.PAGE_LOAD_WARNING_MS, THRESHOLDS.PAGE_LOAD_CRITICAL_MS),
  }

  _pageLoads = [entry, ..._pageLoads].slice(0, MAX_EVENTS)
  persist()
  notify()
  return entry
}

export function addRouteChange({ from, to, durationMs }) {
  if (!import.meta.env.DEV || !_recording) return
  hydrateFromStorage()

  const entry = {
    id: `rc_${Date.now()}_${_routeChanges.length}`,
    timestamp: new Date().toISOString(),
    from,
    to,
    durationMs: Math.round(durationMs * 100) / 100,
  }

  _routeChanges = [entry, ..._routeChanges].slice(0, MAX_EVENTS)
  persist()
  notify()
  return entry
}

export function addImageLoad({ src, durationMs, size = 0, route = null }) {
  if (!import.meta.env.DEV || !_recording) return
  hydrateFromStorage()

  const entry = {
    id: `img_${Date.now()}_${_imageLoads.length}`,
    timestamp: new Date().toISOString(),
    src,
    durationMs: Math.round(durationMs * 100) / 100,
    size,
    route,
  }

  _imageLoads = [entry, ..._imageLoads].slice(0, MAX_EVENTS)
  attachImageToTrace(entry)
  persist()
  notify()
  return entry
}

// Cached snapshot — useSyncExternalStore requires referential stability.
// Only rebuilt when notify() fires (data actually changed).
let _snapshot = null
let _snapshotVersion = 0
let _lastSnapshotVersion = -1

function bumpSnapshotVersion() {
  _snapshotVersion++
  _snapshot = null
}

export function getPerfState() {
  hydrateFromStorage()
  if (_snapshot && _snapshotVersion === _lastSnapshotVersion) return _snapshot
  _lastSnapshotVersion = _snapshotVersion
  _snapshot = {
    recording: _recording,
    dbQueries: _dbQueries,
    apiRequests: _apiRequests,
    pageLoads: _pageLoads,
    routeChanges: _routeChanges,
    imageLoads: _imageLoads,
  }
  return _snapshot
}

export function getDbQueries() { hydrateFromStorage(); return _dbQueries }
export function getApiRequests() { hydrateFromStorage(); return _apiRequests }
export function getPageLoads() { hydrateFromStorage(); return _pageLoads }

export function clearPerfStore() {
  _dbQueries = []
  _apiRequests = []
  _pageLoads = []
  _routeChanges = []
  _imageLoads = []
  try { sessionStorage.removeItem(STORAGE_KEY) } catch (_) {}
  notify()
}

export function subscribePerfStore(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}
