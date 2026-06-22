// debuggers/performance/index.js
// Public API for the performance observability system.
// All instrumentation is dev-only and no-ops in production.

export { default as PerfOverlay } from './PerfOverlay.jsx'
export { default as PerfDashboardScreen } from './PerfDashboardScreen.jsx'

export { installSupabaseProxy, uninstallSupabaseProxy } from './instrumentation/supabaseProxy.js'
export { installFetchProxy, uninstallFetchProxy } from './instrumentation/fetchProxy.js'
export { installClientMetrics, uninstallClientMetrics, measureRender } from './instrumentation/clientMetrics.js'
export { startRequestContext, endRequestContext, getActiveContext } from './instrumentation/requestContext.js'

export {
  getPerfState,
  subscribePerfStore,
  clearPerfStore,
  addDbQuery,
  addApiRequest,
  addPageLoad,
  addRouteChange,
  addImageLoad,
  isRecording,
  setRecording,
  toggleRecording,
} from './store.js'

export { generateRecommendations } from './analysis/recommendations.js'
export { detectDuplicateQueries, detectNPlus1, detectOverfetch, analyzeRequestGroups } from './analysis/overfetch.js'
export { matchKnownIssues, getKnownIssueRules } from './analysis/knownIssues.js'
export { exportSnapshot, downloadSnapshot, copySnapshot, formatSummary, resetAll } from './logger.js'

export {
  startScreenTrace,
  endScreenTrace,
  markTraceLoadSettled,
  getScreenTraces,
  getTraceById,
  getActiveTrace,
  getBackgroundActivity,
  clearScreenTraces,
  subscribeScreenTraces,
} from './screenTrace.js'

import { installSupabaseProxy } from './instrumentation/supabaseProxy.js'
import { installFetchProxy } from './instrumentation/fetchProxy.js'
import { installClientMetrics } from './instrumentation/clientMetrics.js'

/**
 * Initialize all performance instrumentation.
 * Call this once at app startup (after Supabase client is created).
 *
 * @param {{ supabase: object }} options
 */
export function initPerfInstrumentation({ supabase } = {}) {
  if (!import.meta.env.DEV) return

  if (supabase) {
    installSupabaseProxy(supabase)
  }

  installFetchProxy()
  installClientMetrics()
}
