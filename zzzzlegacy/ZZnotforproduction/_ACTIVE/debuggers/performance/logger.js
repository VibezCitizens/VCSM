// debuggers/performance/logger.js
// Reusable performance logger utility.
// Supports multiple output targets: in-memory (default), JSON export, optional DB table.
// DEV-ONLY — all methods are no-ops in production.

import { getPerfState, clearPerfStore } from './store.js'
import { generateRecommendations } from './analysis/recommendations.js'
import { detectDuplicateQueries, detectNPlus1, detectOverfetch, analyzeRequestGroups } from './analysis/overfetch.js'

/**
 * Export the complete performance snapshot as a structured JSON object.
 * Useful for saving to a file or sending to an external dashboard.
 */
export function exportSnapshot() {
  if (!import.meta.env.DEV) return null

  const state = getPerfState()
  const recommendations = generateRecommendations(state)
  const duplicates = detectDuplicateQueries(state.dbQueries)
  const nplus1 = detectNPlus1(state.dbQueries)
  const overfetch = detectOverfetch(state.dbQueries)
  const requestGroups = analyzeRequestGroups(state.dbQueries)

  return {
    exportedAt: new Date().toISOString(),
    summary: {
      totalDbQueries: state.dbQueries.length,
      totalApiRequests: state.apiRequests.length,
      totalPageLoads: state.pageLoads.length,
      totalImages: state.imageLoads.length,
      totalDbTimeMs: state.dbQueries.reduce((s, q) => s + q.durationMs, 0),
      totalApiTimeMs: state.apiRequests.reduce((s, r) => s + r.durationMs, 0),
      duplicateQueryGroups: duplicates.length,
      nplus1Issues: nplus1.length,
      overfetchIssues: overfetch.length,
      criticalRecommendations: recommendations.filter((r) => r.priority === 'critical').length,
    },
    dbQueries: state.dbQueries,
    apiRequests: state.apiRequests,
    pageLoads: state.pageLoads,
    routeChanges: state.routeChanges,
    imageLoads: state.imageLoads,
    analysis: {
      duplicates,
      nplus1,
      overfetch,
      requestGroups,
    },
    recommendations,
  }
}

/**
 * Download the snapshot as a JSON file.
 */
export function downloadSnapshot() {
  if (!import.meta.env.DEV) return

  const snapshot = exportSnapshot()
  if (!snapshot) return

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vcsm-perf-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Copy snapshot to clipboard as JSON.
 */
export async function copySnapshot() {
  if (!import.meta.env.DEV) return

  const snapshot = exportSnapshot()
  if (!snapshot) return

  try {
    await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2))
    return true
  } catch (_) {
    return false
  }
}

/**
 * Generate a human-readable summary string.
 */
export function formatSummary() {
  if (!import.meta.env.DEV) return ''

  const state = getPerfState()
  const recs = generateRecommendations(state)
  const totalDbMs = state.dbQueries.reduce((s, q) => s + q.durationMs, 0)
  const totalApiMs = state.apiRequests.reduce((s, r) => s + r.durationMs, 0)

  const lines = [
    `=== VCSM Performance Snapshot ===`,
    `Time: ${new Date().toISOString()}`,
    ``,
    `DB Queries: ${state.dbQueries.length} (${Math.round(totalDbMs)}ms total)`,
    `API Requests: ${state.apiRequests.length} (${Math.round(totalApiMs)}ms total)`,
    `Page Loads: ${state.pageLoads.length}`,
    `Images: ${state.imageLoads.length}`,
    ``,
    `Recommendations: ${recs.length}`,
    ...recs.slice(0, 10).map((r) => `  [${r.priority.toUpperCase()}] ${r.title}`),
  ]

  return lines.join('\n')
}

/**
 * Export only recommendation data as a structured JSON file.
 * Respects active route filter — if provided, only exports recommendations for that scope.
 * @param {{ recommendations, duplicates, nplus1, routeFilter, analysisLabel }} opts
 */
export function exportRecommendations({ recommendations, duplicates = [], nplus1 = [], routeFilter = null, analysisLabel = 'Session' }) {
  if (!import.meta.env.DEV) return

  const payload = {
    exportedAt: new Date().toISOString(),
    source: '/dev/performance',
    scope: {
      routeFilter: routeFilter ?? 'all (session-wide)',
      analysisLabel,
    },
    totalRecommendations: recommendations.length,
    bySeverity: {
      critical: recommendations.filter((r) => r.priority === 'critical').length,
      high: recommendations.filter((r) => r.priority === 'high').length,
      medium: recommendations.filter((r) => r.priority === 'medium').length,
      low: recommendations.filter((r) => r.priority === 'low').length,
    },
    recommendations: recommendations.map((r) => ({
      id: r.id,
      priority: r.priority,
      category: r.category,
      title: r.title,
      description: r.description,
      impact: r.impact ?? null,
      suggestedFix: r.fix ?? null,
      relatedRoute: r.route ?? routeFilter ?? null,
      relatedTable: r.table ?? null,
    })),
    duplicateQueryContext: duplicates.map((d) => ({
      queryName: d.queryName,
      table: d.table,
      method: d.method,
      count: d.count,
      totalDurationMs: d.totalDurationMs,
    })),
    nPlus1Context: nplus1.map((n) => ({
      table: n.table,
      queryCount: n.queryCount,
      totalDurationMs: n.totalDurationMs,
      avgDurationMs: n.avgDurationMs,
      suggestion: n.suggestion,
    })),
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vcsm-recommendations-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Reset all performance data.
 */
export function resetAll() {
  clearPerfStore()
}
