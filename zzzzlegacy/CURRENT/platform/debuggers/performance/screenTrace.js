// debuggers/performance/screenTrace.js
// Per-screen trace correlation system.
// Groups all DB queries, API requests, and image loads into route-scoped traces.
// Each route navigation creates a new trace that captures everything until the next navigation.

import { THRESHOLDS } from './constants.js'

const MAX_TRACES = 30

let _traces = []
let _activeTrace = null
let _backgroundQueries = []
let _backgroundApiRequests = []
let _listeners = new Set()
let _snapshotVersion = 0
let _snapshot = null
let _lastSnapshotVersion = -1

function notify() {
  _snapshotVersion++
  _snapshot = null
  for (const fn of _listeners) {
    try { fn() } catch (_) {}
  }
}

// --- Trace Lifecycle ---

/**
 * Start a new screen trace for a route navigation.
 * Automatically ends the previous trace.
 */
export function startScreenTrace(route) {
  if (!import.meta.env.DEV) return null

  // End previous trace if active
  if (_activeTrace && !_activeTrace.completed) {
    endScreenTrace()
  }

  _activeTrace = {
    id: `trace_${Date.now()}`,
    route,
    startTime: performance.now(),
    startedAt: new Date().toISOString(),
    loadSettledAt: null,  // set by markTraceLoadSettled after initial paint
    completed: false,
    durationMs: 0,
    dbQueries: [],
    apiRequests: [],
    imageLoads: [],
    alerts: [],
    summary: null,
  }

  _traces = [_activeTrace, ..._traces].slice(0, MAX_TRACES)
  notify()
  return _activeTrace
}

/**
 * End the current screen trace and compute summary.
 */
export function endScreenTrace() {
  if (!import.meta.env.DEV || !_activeTrace) return null

  const trace = _activeTrace
  trace.completed = true
  trace.durationMs = Math.round((performance.now() - trace.startTime) * 100) / 100
  trace.summary = buildTraceSummary(trace)
  trace.alerts = detectAlerts(trace)
  _activeTrace = null
  notify()
  return trace
}

/**
 * Mark the active trace's initial load phase as settled.
 * Called after double-rAF paint. Queries after this point are classified
 * as post-load activity (polling, realtime, lazy data) rather than screen_load.
 */
export function markTraceLoadSettled() {
  if (!import.meta.env.DEV || !_activeTrace) return
  _activeTrace.loadSettledAt = performance.now()
  notify()
}

/**
 * Classify a query's source type based on trace state and timing.
 * Priority: explicit tag > load phase > post-load inference > background
 */
function classifySourceType(query, trace) {
  // 1. If explicitly tagged by caller (e.g., polling hooks)
  if (query._sourceType) return query._sourceType

  // 2. No active trace = background
  if (!trace) return 'background'

  // 3. Before load settled = screen_load
  if (!trace.loadSettledAt) return 'screen_load'

  // 4. After load settled — infer from timing
  const queryTime = query.at || performance.now()
  if (queryTime <= trace.loadSettledAt) return 'screen_load'

  // 5. Post-load: default to post_load (could be polling, realtime, or lazy)
  return 'post_load'
}

/**
 * Attach a DB query to the active trace.
 * If no active trace, it's background activity.
 */
export function attachQueryToTrace(query) {
  if (!import.meta.env.DEV) return

  if (_activeTrace) {
    query._sourceType = classifySourceType(query, _activeTrace)
    query._isBackground = query._sourceType === 'background'
    query._traceId = _activeTrace.id
    _activeTrace.dbQueries.push(query)
  } else {
    query._sourceType = 'background'
    query._isBackground = true
    query._traceId = null
    _backgroundQueries = [query, ..._backgroundQueries].slice(0, 200)
    notify()
  }
}

/**
 * Attach an API request to the active trace.
 * If no active trace, it's background activity.
 */
export function attachApiToTrace(request) {
  if (!import.meta.env.DEV) return

  if (_activeTrace) {
    request._sourceType = classifySourceType(request, _activeTrace)
    request._isBackground = request._sourceType === 'background'
    request._traceId = _activeTrace.id
    _activeTrace.apiRequests.push(request)
  } else {
    request._sourceType = 'background'
    request._isBackground = true
    request._traceId = null
    _backgroundApiRequests = [request, ..._backgroundApiRequests].slice(0, 100)
    notify()
  }
}

/**
 * Attach an image load to the active trace.
 */
export function attachImageToTrace(image) {
  if (!import.meta.env.DEV || !_activeTrace) return
  _activeTrace.imageLoads.push(image)
}

// --- Summary Builder ---

function buildTraceSummary(trace) {
  const queries = trace.dbQueries

  // Source-type breakdown
  const screenLoadQueries = queries.filter((q) => q._sourceType === 'screen_load')
  const postLoadQueries = queries.filter((q) => q._sourceType === 'post_load')
  const backgroundQueries = queries.filter((q) => q._sourceType === 'background')

  const totalDbMs = queries.reduce((s, q) => s + (q.durationMs || 0), 0)
  const totalApiMs = trace.apiRequests.reduce((s, r) => s + (r.durationMs || 0), 0)
  const totalImageMs = trace.imageLoads.reduce((s, i) => s + (i.durationMs || 0), 0)
  const totalRows = queries.reduce((s, q) => s + (q.rowCount || 0), 0)
  const totalPayload = queries.reduce((s, q) => s + (q.payloadSize || 0), 0)

  // Group by DAL name
  const byDal = new Map()
  for (const q of queries) {
    const name = q.queryName || q.table || 'unknown'
    if (!byDal.has(name)) byDal.set(name, { name, table: q.table, calls: 0, totalMs: 0, totalRows: 0 })
    const g = byDal.get(name)
    g.calls++
    g.totalMs += q.durationMs || 0
    g.totalRows += q.rowCount || 0
  }

  // Group by table
  const byTable = new Map()
  for (const q of queries) {
    const t = q.table || 'unknown'
    if (!byTable.has(t)) byTable.set(t, { table: t, calls: 0, totalMs: 0 })
    const g = byTable.get(t)
    g.calls++
    g.totalMs += q.durationMs || 0
  }

  // Detect duplicates within this trace
  const dupGroups = []
  for (const [name, g] of byDal) {
    if (g.calls > 1) dupGroups.push({ name, table: g.table, count: g.calls, totalMs: g.totalMs })
  }

  // Detect N+1 within this trace
  const nplus1 = []
  for (const [name, g] of byDal) {
    if (g.calls >= 3) nplus1.push({ name, table: g.table, count: g.calls, avgMs: g.totalMs / g.calls })
  }

  return {
    route: trace.route,
    durationMs: trace.durationMs,
    totalDbMs: Math.round(totalDbMs * 100) / 100,
    totalApiMs: Math.round(totalApiMs * 100) / 100,
    totalImageMs: Math.round(totalImageMs * 100) / 100,
    dbPct: trace.durationMs > 0 ? Math.round((totalDbMs / trace.durationMs) * 100) : 0,
    queryCount: queries.length,
    apiCount: trace.apiRequests.length,
    imageCount: trace.imageLoads.length,
    totalRows,
    totalPayload,
    byDal: Array.from(byDal.values()).sort((a, b) => b.calls - a.calls),
    byTable: Array.from(byTable.values()).sort((a, b) => b.calls - a.calls),
    duplicateGroups: dupGroups.sort((a, b) => b.count - a.count),
    nplus1: nplus1.sort((a, b) => b.count - a.count),
    sourceBreakdown: {
      screenLoad: screenLoadQueries.length,
      postLoad: postLoadQueries.length,
      background: backgroundQueries.length,
    },
    hasLoadSettled: !!trace.loadSettledAt,
  }
}

// --- Threshold Alerts ---

function detectAlerts(trace) {
  const alerts = []
  const s = trace.summary
  if (!s) return alerts

  if (s.queryCount > 25) {
    alerts.push({ level: 'critical', message: `${s.queryCount} DB queries on ${s.route} — review DAL usage` })
  } else if (s.queryCount > 15) {
    alerts.push({ level: 'warning', message: `${s.queryCount} DB queries on ${s.route}` })
  }

  if (s.duplicateGroups.length > 5) {
    alerts.push({ level: 'critical', message: `${s.duplicateGroups.length} duplicate query groups on ${s.route}` })
  } else if (s.duplicateGroups.length > 0) {
    alerts.push({ level: 'warning', message: `${s.duplicateGroups.length} duplicate query groups on ${s.route}` })
  }

  if (s.nplus1.length > 0) {
    alerts.push({ level: 'critical', message: `${s.nplus1.length} N+1 patterns on ${s.route}` })
  }

  if (s.durationMs > THRESHOLDS.PAGE_LOAD_CRITICAL_MS) {
    alerts.push({ level: 'critical', message: `Screen load ${Math.round(s.durationMs)}ms on ${s.route}` })
  } else if (s.durationMs > THRESHOLDS.PAGE_LOAD_WARNING_MS) {
    alerts.push({ level: 'warning', message: `Screen load ${Math.round(s.durationMs)}ms on ${s.route}` })
  }

  if (s.totalDbMs > 1000) {
    alerts.push({ level: 'critical', message: `DB time ${Math.round(s.totalDbMs)}ms on ${s.route}` })
  }

  if (s.imageCount > 20) {
    alerts.push({ level: 'warning', message: `${s.imageCount} images loaded on ${s.route}` })
  }

  return alerts
}

// --- Public Queries ---

export function getActiveTrace() { return _activeTrace }

export function getScreenTraces() {
  if (_snapshot && _snapshotVersion === _lastSnapshotVersion) return _snapshot
  _lastSnapshotVersion = _snapshotVersion
  _snapshot = _traces
  return _snapshot
}

export function getTraceById(traceId) {
  return _traces.find((t) => t.id === traceId) ?? null
}

export function getBackgroundActivity() {
  return {
    dbQueries: _backgroundQueries,
    apiRequests: _backgroundApiRequests,
    totalDbMs: _backgroundQueries.reduce((s, q) => s + (q.durationMs || 0), 0),
    totalApiMs: _backgroundApiRequests.reduce((s, r) => s + (r.durationMs || 0), 0),
  }
}

export function clearScreenTraces() {
  _traces = []
  _activeTrace = null
  _backgroundQueries = []
  _backgroundApiRequests = []
  _snapshotVersion++
  _snapshot = null
  notify()
}

export function subscribeScreenTraces(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}
