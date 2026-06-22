// debuggers/performance/analysis/overfetch.js
// Detects overfetching, duplicate queries, N+1 patterns, and excessive payloads.
// Operates on the stored query data — pure analysis, no side effects.

import { THRESHOLDS, SEVERITY } from '../constants.js'

/**
 * Detect duplicate queries: same table + method + queryName within a time window.
 * Returns groups of duplicates with counts.
 */
export function detectDuplicateQueries(dbQueries) {
  const groups = new Map()

  for (const q of dbQueries) {
    const key = `${q.table}|${q.method}|${q.queryName}`
    if (!groups.has(key)) {
      groups.set(key, { key, table: q.table, method: q.method, queryName: q.queryName, queries: [] })
    }
    groups.get(key).queries.push(q)
  }

  return Array.from(groups.values())
    .filter((g) => g.queries.length > 1)
    .sort((a, b) => b.queries.length - a.queries.length)
    .map((g) => ({
      ...g,
      count: g.queries.length,
      totalDurationMs: g.queries.reduce((sum, q) => sum + q.durationMs, 0),
      severity: g.queries.length >= 5 ? SEVERITY.CRITICAL : SEVERITY.WARNING,
    }))
}

/**
 * Detect N+1 patterns: rapid sequential queries to the same table,
 * typically 3+ queries within a short burst.
 */
export function detectNPlus1(dbQueries) {
  const issues = []
  const tableGroups = new Map()

  // Group queries by table, ordered by time
  for (const q of [...dbQueries].reverse()) {
    const table = q.table
    if (!tableGroups.has(table)) tableGroups.set(table, [])
    tableGroups.get(table).push(q)
  }

  for (const [table, queries] of tableGroups) {
    if (queries.length < THRESHOLDS.NPLUS1_THRESHOLD) continue

    // Find bursts: queries within 500ms of each other
    let burstStart = 0
    for (let i = 1; i <= queries.length; i++) {
      const isEnd = i === queries.length
      const gap = isEnd ? Infinity : (queries[i].at - queries[i - 1].at)

      if (gap > 500 || isEnd) {
        const burstSize = i - burstStart
        if (burstSize >= THRESHOLDS.NPLUS1_THRESHOLD) {
          const burst = queries.slice(burstStart, i)
          issues.push({
            table,
            queryCount: burstSize,
            totalDurationMs: burst.reduce((s, q) => s + q.durationMs, 0),
            avgDurationMs: burst.reduce((s, q) => s + q.durationMs, 0) / burstSize,
            queries: burst.map((q) => q.id),
            route: burst[0]?.route,
            severity: burstSize >= 10 ? SEVERITY.CRITICAL : SEVERITY.WARNING,
            suggestion: `Consider batching these ${burstSize} sequential queries to ${table} into a single query with an IN clause or RPC.`,
          })
        }
        burstStart = i
      }
    }
  }

  return issues.sort((a, b) => b.queryCount - a.queryCount)
}

/**
 * Detect overfetching: queries returning too many columns or rows.
 */
export function detectOverfetch(dbQueries) {
  const issues = []

  for (const q of dbQueries) {
    const problems = []

    // Too many columns
    if (q.columns.includes('*')) {
      problems.push({
        type: 'select_star',
        message: `Uses SELECT * — specify needed columns only`,
        severity: SEVERITY.CRITICAL,
      })
    } else if (q.columnCount > THRESHOLDS.OVERFETCH_COLUMN_THRESHOLD) {
      problems.push({
        type: 'too_many_columns',
        message: `Selects ${q.columnCount} columns — consider reducing to only what the UI needs`,
        severity: SEVERITY.WARNING,
      })
    }

    // Too many rows without pagination
    if (q.rowCount > THRESHOLDS.ROW_COUNT_CRITICAL) {
      problems.push({
        type: 'too_many_rows',
        message: `Returns ${q.rowCount} rows — add pagination or limit`,
        severity: SEVERITY.CRITICAL,
      })
    } else if (q.rowCount > THRESHOLDS.ROW_COUNT_WARNING) {
      problems.push({
        type: 'many_rows',
        message: `Returns ${q.rowCount} rows — verify pagination is applied`,
        severity: SEVERITY.WARNING,
      })
    }

    // Large payload
    if (q.payloadSize > THRESHOLDS.PAYLOAD_CRITICAL_BYTES) {
      problems.push({
        type: 'large_payload',
        message: `Payload is ${formatBytes(q.payloadSize)} — consider column reduction or pagination`,
        severity: SEVERITY.CRITICAL,
      })
    } else if (q.payloadSize > THRESHOLDS.PAYLOAD_WARNING_BYTES) {
      problems.push({
        type: 'medium_payload',
        message: `Payload is ${formatBytes(q.payloadSize)} — monitor growth`,
        severity: SEVERITY.WARNING,
      })
    }

    if (problems.length > 0) {
      issues.push({
        queryId: q.id,
        queryName: q.queryName,
        table: q.table,
        route: q.route,
        problems,
        worstSeverity: problems.some((p) => p.severity === SEVERITY.CRITICAL)
          ? SEVERITY.CRITICAL
          : SEVERITY.WARNING,
      })
    }
  }

  return issues.sort((a, b) => {
    const sevOrder = { critical: 0, warning: 1, ok: 2 }
    return (sevOrder[a.worstSeverity] ?? 2) - (sevOrder[b.worstSeverity] ?? 2)
  })
}

/**
 * Analyze request-level aggregates for a set of queries grouped by requestId.
 */
export function analyzeRequestGroups(dbQueries) {
  const groups = new Map()

  for (const q of dbQueries) {
    const key = q.requestId ?? q.route ?? '_ungrouped'
    if (!groups.has(key)) {
      groups.set(key, {
        requestId: q.requestId,
        route: q.route,
        queries: [],
        totalDbMs: 0,
        totalRows: 0,
        totalPayload: 0,
      })
    }
    const g = groups.get(key)
    g.queries.push(q)
    g.totalDbMs += q.durationMs
    g.totalRows += q.rowCount
    g.totalPayload += q.payloadSize
  }

  return Array.from(groups.values()).sort((a, b) => b.totalDbMs - a.totalDbMs)
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
