// ============================================================
// Feed Profiler — DAL Read Counters + Pipeline Tracer
// ============================================================
// DEV-ONLY. Instruments the real feed pipeline to track:
// - Which DAL methods fire, how often, and how long
// - Which tables are read and how many times
// - Serial vs parallel execution
// - Duplicate reads detection
// - N+1 pattern detection
// - Per-feed-load grouped reports
//
// Works by wrapping DAL functions with timing + counting instrumentation.
// All data stored in-memory with manual subscription for UI.

const MAX_SESSIONS = 20

let _sessions = []
let _activeSession = null
let _listeners = new Set()

function notify() {
  for (const fn of _listeners) {
    try { fn() } catch (_) {}
  }
}

// --- Session Management ---

/**
 * Start a new feed profiling session.
 * Call this at the beginning of a feed load (fetchPosts).
 *
 * @param {Object} [meta] - Optional metadata (route, actorId, fresh, etc.)
 * @returns {Object} session handle
 */
export function startFeedSession(meta = {}) {
  if (!import.meta.env.DEV) return null

  _activeSession = {
    id: `feed_${Date.now()}`,
    startTime: performance.now(),
    startedAt: new Date().toISOString(),
    meta,
    dalCalls: [],
    steps: [],
    completed: false,
    summary: null,
  }

  _sessions = [_activeSession, ..._sessions].slice(0, MAX_SESSIONS)
  notify()
  return _activeSession
}

/**
 * End the current feed profiling session.
 * Call this when feed load is complete.
 */
export function endFeedSession() {
  if (!import.meta.env.DEV || !_activeSession) return null

  const session = _activeSession
  session.completed = true
  session.durationMs = Math.round((performance.now() - session.startTime) * 100) / 100
  session.summary = buildSessionSummary(session)
  _activeSession = null
  notify()
  return session
}

/**
 * Record a pipeline step (non-DAL, e.g. "normalize", "upsertActors", "hydrateActors").
 *
 * @param {string} stepName
 * @param {Object} [detail]
 */
export function recordStep(stepName, detail = {}) {
  if (!import.meta.env.DEV || !_activeSession) return

  _activeSession.steps.push({
    step: stepName,
    at: performance.now() - _activeSession.startTime,
    timestamp: new Date().toISOString(),
    ...detail,
  })
}

// --- DAL Instrumentation ---

/**
 * Wrap a DAL function with profiling instrumentation.
 * Returns a new function with identical signature that records:
 * - call count, timing, table, result size, caller info
 *
 * @param {string} dalName - Human-readable DAL method name (e.g. "readFeedPostsPage")
 * @param {string} table - Primary table read (e.g. "vc.posts")
 * @param {Function} dalFn - The original DAL function
 * @returns {Function} instrumented DAL function
 */
export function wrapDAL(dalName, table, dalFn) {
  if (!import.meta.env.DEV) return dalFn

  return async function instrumentedDAL(...args) {
    const session = _activeSession
    const startTime = performance.now()

    const entry = {
      dalName,
      table,
      startMs: session ? startTime - session.startTime : 0,
      durationMs: 0,
      rowCount: 0,
      args: summarizeArgs(args),
      error: null,
    }

    try {
      const result = await dalFn(...args)

      entry.durationMs = Math.round((performance.now() - startTime) * 100) / 100

      // Detect row count from result shape
      if (Array.isArray(result)) {
        entry.rowCount = result.length
      } else if (result && typeof result === 'object') {
        if (Array.isArray(result.data)) entry.rowCount = result.data.length
        else if (result.pageRows) entry.rowCount = result.pageRows.length
        else if (result.actors) entry.rowCount = result.actors.length
        else entry.rowCount = 1
      }

      if (session) {
        session.dalCalls.push(entry)
        notify()
      }

      return result
    } catch (err) {
      entry.durationMs = Math.round((performance.now() - startTime) * 100) / 100
      entry.error = err.message ?? String(err)

      if (session) {
        session.dalCalls.push(entry)
        notify()
      }

      throw err
    }
  }
}

/**
 * Summarize arguments for display (avoid logging full arrays/objects).
 */
function summarizeArgs(args) {
  if (!args || args.length === 0) return '()'
  try {
    const first = args[0]
    if (Array.isArray(first)) return `([${first.length} items])`
    if (typeof first === 'object' && first !== null) {
      const keys = Object.keys(first).slice(0, 5)
      return `({ ${keys.join(', ')} })`
    }
    return `(${String(first).slice(0, 40)})`
  } catch (_) {
    return '(...)'
  }
}

// --- Analysis ---

function buildSessionSummary(session) {
  const calls = session.dalCalls
  const totalDbMs = calls.reduce((s, c) => s + c.durationMs, 0)
  const totalRows = calls.reduce((s, c) => s + c.rowCount, 0)

  // Group by DAL name
  const byDal = new Map()
  for (const c of calls) {
    if (!byDal.has(c.dalName)) {
      byDal.set(c.dalName, { dalName: c.dalName, table: c.table, calls: [], totalMs: 0, totalRows: 0 })
    }
    const g = byDal.get(c.dalName)
    g.calls.push(c)
    g.totalMs += c.durationMs
    g.totalRows += c.rowCount
  }

  const dalStats = Array.from(byDal.values())
    .map((g) => ({
      dalName: g.dalName,
      table: g.table,
      callCount: g.calls.length,
      totalMs: Math.round(g.totalMs * 100) / 100,
      avgMs: Math.round((g.totalMs / g.calls.length) * 100) / 100,
      totalRows: g.totalRows,
      isDuplicate: g.calls.length > 1,
    }))
    .sort((a, b) => b.callCount - a.callCount)

  // Group by table
  const byTable = new Map()
  for (const c of calls) {
    if (!byTable.has(c.table)) {
      byTable.set(c.table, { table: c.table, readCount: 0, totalMs: 0 })
    }
    const t = byTable.get(c.table)
    t.readCount++
    t.totalMs += c.durationMs
  }

  const tableStats = Array.from(byTable.values()).sort((a, b) => b.readCount - a.readCount)

  // Detect serial chains: DAL calls that start after the previous one ends
  let serialCount = 0
  const sorted = [...calls].sort((a, b) => a.startMs - b.startMs)
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = sorted[i - 1].startMs + sorted[i - 1].durationMs
    if (sorted[i].startMs >= prevEnd - 1) {
      serialCount++
    }
  }

  // Detect N+1: same DAL called 3+ times in rapid succession
  const nplus1 = dalStats.filter((d) => d.callCount >= 3)

  // Detect duplicate reads: same DAL + same args called multiple times
  const duplicates = dalStats.filter((d) => d.isDuplicate)

  return {
    feedLoadMs: session.durationMs,
    totalDbMs: Math.round(totalDbMs * 100) / 100,
    totalRows,
    dalCallCount: calls.length,
    uniqueDalMethods: byDal.size,
    uniqueTables: byTable.size,
    serialChains: serialCount,
    parallelCalls: calls.length - serialCount - 1,
    dalStats,
    tableStats,
    duplicates,
    nplus1,
    errors: calls.filter((c) => c.error),
  }
}

// --- Public Queries ---

export function getActiveFeedSession() { return _activeSession }
export function getFeedSessions() { return _sessions }
export function getLatestFeedSession() { return _sessions[0] ?? null }

export function clearFeedSessions() {
  _sessions = []
  _activeSession = null
  notify()
}

export function subscribeFeedProfiler(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}

// --- Formatted Output ---

/**
 * Generate a formatted text report for a feed session.
 * @param {Object} [session]
 * @returns {string}
 */
export function formatFeedReport(session) {
  if (!session) session = _sessions[0]
  if (!session) return 'No feed sessions captured.'
  if (!session.summary) return 'Session not yet complete.'

  const s = session.summary
  const lines = [
    `=== FEED PROFILER REPORT ===`,
    `Session: ${session.id}`,
    `Started: ${session.startedAt}`,
    `Feed Load: ${s.feedLoadMs}ms`,
    `DB Time: ${s.totalDbMs}ms (${Math.round((s.totalDbMs / (s.feedLoadMs || 1)) * 100)}% of load)`,
    `Total Rows: ${s.totalRows}`,
    `DAL Calls: ${s.dalCallCount} (${s.uniqueDalMethods} unique methods, ${s.uniqueTables} tables)`,
    `Execution: ${s.parallelCalls} parallel, ${s.serialChains} serial`,
    ``,
    `--- DAL Methods (sorted by call count) ---`,
  ]

  for (const d of s.dalStats) {
    const flag = d.isDuplicate ? ' ** DUPLICATE' : ''
    lines.push(`  ${d.dalName} x${d.callCount}  ${d.totalMs}ms (avg ${d.avgMs}ms)  ${d.totalRows} rows  [${d.table}]${flag}`)
  }

  lines.push(``)
  lines.push(`--- Tables (sorted by read frequency) ---`)
  for (const t of s.tableStats) {
    const flag = t.readCount > 2 ? ' ** HOT TABLE' : ''
    lines.push(`  ${t.table}  ${t.readCount}x  ${Math.round(t.totalMs)}ms${flag}`)
  }

  if (s.duplicates.length > 0) {
    lines.push(``)
    lines.push(`--- DUPLICATE READS ---`)
    for (const d of s.duplicates) {
      lines.push(`  ${d.dalName} called ${d.callCount}x → ${d.table} (${d.totalMs}ms wasted)`)
    }
  }

  if (s.nplus1.length > 0) {
    lines.push(``)
    lines.push(`--- N+1 SUSPECTS ---`)
    for (const n of s.nplus1) {
      lines.push(`  ${n.dalName} called ${n.callCount}x → ${n.table} — batch with IN clause`)
    }
  }

  if (s.errors.length > 0) {
    lines.push(``)
    lines.push(`--- ERRORS ---`)
    for (const e of s.errors) {
      lines.push(`  ${e.dalName}: ${e.error}`)
    }
  }

  // Pipeline steps
  if (session.steps.length > 0) {
    lines.push(``)
    lines.push(`--- Pipeline Steps ---`)
    for (const step of session.steps) {
      lines.push(`  ${Math.round(step.at)}ms  ${step.step}`)
    }
  }

  return lines.join('\n')
}
