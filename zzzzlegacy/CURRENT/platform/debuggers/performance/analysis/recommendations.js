// debuggers/performance/analysis/recommendations.js
// Auto-generates actionable performance recommendations based on captured data.
// Pure analysis — reads from store, outputs structured recommendations.

import { THRESHOLDS, SEVERITY } from '../constants.js'
import { detectDuplicateQueries, detectNPlus1, detectOverfetch } from './overfetch.js'

const PRIORITY = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' }

/**
 * Generate all recommendations from current performance data.
 * @param {{ dbQueries, apiRequests, pageLoads, imageLoads }} state
 * @returns {Array<{ id, priority, category, title, description, impact, fix }>}
 */
export function generateRecommendations(state) {
  const recs = []
  let idCounter = 0
  const add = (rec) => { idCounter++; recs.push({ id: `rec_${idCounter}`, ...rec }) }

  // --- Database recommendations ---
  analyzeDbPerformance(state.dbQueries, add)

  // --- API recommendations ---
  analyzeApiPerformance(state.apiRequests, add)

  // --- Page load recommendations ---
  analyzePageLoads(state.pageLoads, add)

  // --- Image/asset recommendations ---
  analyzeImages(state.imageLoads ?? [], add)

  return recs.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 }
    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3)
  })
}

function analyzeDbPerformance(queries, add) {
  if (!queries || queries.length === 0) return

  // Duplicate queries
  const duplicates = detectDuplicateQueries(queries)
  for (const dup of duplicates) {
    add({
      priority: dup.count >= 5 ? PRIORITY.CRITICAL : PRIORITY.HIGH,
      category: 'database',
      title: `Duplicate queries to ${dup.table}`,
      description: `"${dup.queryName}" is called ${dup.count} times (${Math.round(dup.totalDurationMs)}ms total). Same table + method + name within the session.`,
      impact: `${Math.round(dup.totalDurationMs)}ms wasted on repeated identical reads`,
      fix: `Cache the result using createTTLCache() from shared/lib/ttlCache.js, or deduplicate at the hook/controller level. If multiple components need this data, lift the fetch to a shared parent or use the hydration store.`,
    })
  }

  // N+1 patterns
  const nplus1 = detectNPlus1(queries)
  for (const issue of nplus1) {
    add({
      priority: issue.queryCount >= 10 ? PRIORITY.CRITICAL : PRIORITY.HIGH,
      category: 'database',
      title: `N+1 pattern on ${issue.table}`,
      description: `${issue.queryCount} sequential queries to ${issue.table} in rapid succession (avg ${Math.round(issue.avgDurationMs)}ms each).`,
      impact: `${Math.round(issue.totalDurationMs)}ms total — could be a single batched query`,
      fix: issue.suggestion,
    })
  }

  // Overfetch
  const overfetch = detectOverfetch(queries)
  for (const issue of overfetch) {
    for (const problem of issue.problems) {
      add({
        priority: problem.severity === SEVERITY.CRITICAL ? PRIORITY.HIGH : PRIORITY.MEDIUM,
        category: 'database',
        title: `${problem.type === 'select_star' ? 'SELECT * detected' : problem.type === 'too_many_rows' ? 'Large result set' : 'Overfetch'} on ${issue.table}`,
        description: `${problem.message} in query "${issue.queryName}" on route ${issue.route ?? 'unknown'}.`,
        impact: problem.type === 'select_star'
          ? 'Fetches all columns including unused ones — increases payload and transfer time'
          : 'Excessive data transfer slows response and increases memory usage',
        fix: problem.type === 'select_star'
          ? 'Replace .select(\'*\') with explicit columns needed by the UI (project rule: explicit column selection in all DALs).'
          : problem.type.includes('rows')
            ? 'Add .limit() or .range() for pagination. Check if the UI actually renders all returned rows.'
            : 'Review which columns the consuming component uses and trim the select list.',
      })
    }
  }

  // Slow individual queries
  const slowQueries = queries.filter((q) => q.durationMs >= THRESHOLDS.QUERY_CRITICAL_MS)
  for (const q of slowQueries.slice(0, 5)) {
    add({
      priority: PRIORITY.CRITICAL,
      category: 'database',
      title: `Slow query: ${q.queryName} (${Math.round(q.durationMs)}ms)`,
      description: `Query to ${q.table} took ${Math.round(q.durationMs)}ms, exceeding the ${THRESHOLDS.QUERY_CRITICAL_MS}ms critical threshold.`,
      impact: 'Directly delays page load or interaction response',
      fix: 'Check if an index exists on the filtered columns. Review the query plan. Consider caching if the data is read-heavy.',
    })
  }

  // Sequential queries that could be parallel
  const routeGroups = new Map()
  for (const q of queries) {
    const key = q.route ?? '_'
    if (!routeGroups.has(key)) routeGroups.set(key, [])
    routeGroups.get(key).push(q)
  }

  for (const [route, rQueries] of routeGroups) {
    if (rQueries.length < 3) continue
    const sorted = [...rQueries].sort((a, b) => a.at - b.at)
    let sequentialCount = 0
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].at - (sorted[i - 1].at + sorted[i - 1].durationMs) < 5) {
        sequentialCount++
      }
    }
    if (sequentialCount >= 2) {
      add({
        priority: PRIORITY.MEDIUM,
        category: 'database',
        title: `Sequential queries on ${route}`,
        description: `${sequentialCount + 1} queries run sequentially when they could be parallelized with Promise.all().`,
        impact: 'Total wait time is the sum instead of the max of query durations',
        fix: 'In the controller, wrap independent DAL calls in Promise.all([dalA(), dalB()]) instead of sequential awaits.',
      })
    }
  }
}

function analyzeApiPerformance(requests, add) {
  if (!requests || requests.length === 0) return

  const slow = requests.filter((r) => r.durationMs >= THRESHOLDS.API_CRITICAL_MS)
  for (const r of slow.slice(0, 3)) {
    add({
      priority: PRIORITY.HIGH,
      category: 'api',
      title: `Slow API call: ${r.method} ${r.url} (${Math.round(r.durationMs)}ms)`,
      description: `Request took ${Math.round(r.durationMs)}ms, exceeding the ${THRESHOLDS.API_CRITICAL_MS}ms threshold.`,
      impact: 'Blocks page rendering or interaction',
      fix: 'Investigate server-side processing time. Check if the endpoint can be cached or if the response payload can be reduced.',
    })
  }

  // Large responses
  const large = requests.filter((r) => r.responseSize > THRESHOLDS.PAYLOAD_WARNING_BYTES)
  for (const r of large.slice(0, 3)) {
    add({
      priority: PRIORITY.MEDIUM,
      category: 'api',
      title: `Large response: ${r.url} (${formatBytes(r.responseSize)})`,
      description: `Response is ${formatBytes(r.responseSize)}, which increases transfer time especially on mobile.`,
      impact: 'Slower data transfer on mobile/slow networks',
      fix: 'Reduce payload by selecting fewer fields, paginating, or compressing the response.',
    })
  }
}

function analyzePageLoads(pageLoads, add) {
  if (!pageLoads || pageLoads.length === 0) return

  const slow = pageLoads.filter((p) => p.loadTimeMs >= THRESHOLDS.PAGE_LOAD_CRITICAL_MS)
  for (const p of slow.slice(0, 3)) {
    const breakdown = []
    if (p.dbTimeMs > 0) breakdown.push(`DB: ${Math.round(p.dbTimeMs)}ms`)
    if (p.apiTimeMs > 0) breakdown.push(`API/TTFB: ${Math.round(p.apiTimeMs)}ms`)
    if (p.renderTimeMs > 0) breakdown.push(`Render: ${Math.round(p.renderTimeMs)}ms`)
    if (p.hydrationTimeMs > 0) breakdown.push(`Hydration: ${Math.round(p.hydrationTimeMs)}ms`)

    add({
      priority: PRIORITY.CRITICAL,
      category: 'page_load',
      title: `Slow page load: ${p.route} (${Math.round(p.loadTimeMs)}ms)`,
      description: `Page load took ${Math.round(p.loadTimeMs)}ms. ${breakdown.length > 0 ? 'Breakdown: ' + breakdown.join(', ') : ''}`,
      impact: 'Users on mobile may abandon the page before it renders',
      fix: 'Review the route\'s data dependencies. Ensure parallel fetching, appropriate caching, and lazy loading of below-fold content.',
    })
  }
}

function analyzeImages(imageLoads, add) {
  if (!imageLoads || imageLoads.length === 0) return

  const largeImages = imageLoads.filter((i) => i.size > 500_000)
  if (largeImages.length > 0) {
    add({
      priority: PRIORITY.MEDIUM,
      category: 'assets',
      title: `${largeImages.length} large images detected`,
      description: `Images over 500KB: ${largeImages.map((i) => `${i.src} (${formatBytes(i.size)})`).slice(0, 3).join(', ')}`,
      impact: 'Large images are the primary cause of slow mobile loads',
      fix: 'Use WebP/AVIF format, apply browser-image-compression before upload, and serve responsive sizes via Cloudflare R2 transforms.',
    })
  }

  const slowImages = imageLoads.filter((i) => i.durationMs > 2000)
  if (slowImages.length > 0) {
    add({
      priority: PRIORITY.MEDIUM,
      category: 'assets',
      title: `${slowImages.length} slow-loading images`,
      description: `Images taking >2s to load. Worst: ${slowImages.slice(0, 3).map((i) => `${i.src} (${Math.round(i.durationMs)}ms)`).join(', ')}`,
      impact: 'Delays visual completeness, especially above the fold',
      fix: 'Add loading="lazy" for below-fold images. Preload hero images. Consider placeholder blur-up pattern.',
    })
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
