// ============================================================
// Notifications Engine — Trace / Observability Service
// ============================================================
// Structured pipeline tracing for notification event processing.
// Captures a timeline of steps with durations, statuses, and metadata.
// Designed to be injected as `debugReporter` via configureNotificationsEngine().

const MAX_PIPELINES = 50

let _pipelines = []
let _listeners = new Set()

function notify() {
  for (const fn of _listeners) {
    try { fn() } catch (_) {}
  }
}

// --- Pipeline Trace Collector ---

/**
 * Create a debug reporter function suitable for `configureNotificationsEngine({ debugReporter })`.
 * Collects all trace events into structured pipeline timelines.
 *
 * @returns {Function} debugReporter function
 */
export function createPipelineTracer() {
  return function debugReporter({ operation, step, status, ...detail }) {
    const now = performance.now()
    const timestamp = new Date().toISOString()

    // Find or create pipeline for this operation
    let pipeline = _pipelines.find((p) => p.operation === operation && !p.completed)

    if (!pipeline) {
      pipeline = {
        id: `pipe_${Date.now()}_${_pipelines.length}`,
        operation,
        startedAt: timestamp,
        startTime: now,
        steps: [],
        completed: false,
        summary: null,
      }
      _pipelines = [pipeline, ..._pipelines].slice(0, MAX_PIPELINES)
    }

    const entry = {
      step,
      status,
      timestamp,
      elapsedMs: Math.round((now - pipeline.startTime) * 100) / 100,
      ...detail,
    }

    pipeline.steps.push(entry)

    // Detect pipeline completion
    if (step === 'PUBLISH_COMPLETE' || step === 'INBOX_FETCH_COMPLETE' || step === 'COUNT_UNREAD_SUCCESS') {
      pipeline.completed = true
      pipeline.durationMs = entry.elapsedMs
      pipeline.summary = buildPipelineSummary(pipeline)
    }

    notify()
  }
}

/**
 * Build a summary of a completed pipeline.
 */
function buildPipelineSummary(pipeline) {
  const steps = pipeline.steps
  const errorSteps = steps.filter((s) => s.status === 'error')
  const warnSteps = steps.filter((s) => s.status === 'warn')

  return {
    operation: pipeline.operation,
    durationMs: pipeline.durationMs,
    stepCount: steps.length,
    errorCount: errorSteps.length,
    warnCount: warnSteps.length,
    eventId: steps.find((s) => s.eventId)?.eventId ?? null,
    recipientCount: steps.find((s) => s.count !== undefined && s.step.includes('RECIPIENT'))?.count ?? null,
    errors: errorSteps.map((s) => ({ step: s.step, error: s.error })),
    warnings: warnSteps.map((s) => ({ step: s.step, message: s.message ?? s.eventKey ?? s.step })),
  }
}

// --- Public API ---

/**
 * Get all captured pipeline traces.
 * @returns {Array}
 */
export function getPipelineTraces() {
  return _pipelines
}

/**
 * Get completed pipeline summaries only.
 * @returns {Array}
 */
export function getPipelineSummaries() {
  return _pipelines.filter((p) => p.completed).map((p) => p.summary)
}

/**
 * Get the most recent pipeline trace.
 * @returns {Object|null}
 */
export function getLatestPipeline() {
  return _pipelines[0] ?? null
}

/**
 * Clear all pipeline traces.
 */
export function clearPipelineTraces() {
  _pipelines = []
  notify()
}

/**
 * Subscribe to trace changes.
 * @param {Function} fn
 * @returns {Function} unsubscribe
 */
export function subscribePipelineTraces(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}

/**
 * Export all pipeline data as a structured snapshot.
 * @returns {Object}
 */
export function exportTraceSnapshot() {
  return {
    exportedAt: new Date().toISOString(),
    pipelineCount: _pipelines.length,
    completedCount: _pipelines.filter((p) => p.completed).length,
    pipelines: _pipelines.map((p) => ({
      id: p.id,
      operation: p.operation,
      startedAt: p.startedAt,
      durationMs: p.durationMs ?? null,
      completed: p.completed,
      stepCount: p.steps.length,
      summary: p.summary,
      steps: p.steps,
    })),
  }
}

/**
 * Format a pipeline trace as a human-readable string.
 * @param {Object} pipeline
 * @returns {string}
 */
export function formatPipelineTrace(pipeline) {
  if (!pipeline) return 'No pipeline data'

  const lines = [
    `Pipeline: ${pipeline.operation} (${pipeline.id})`,
    `Started: ${pipeline.startedAt}`,
    `Duration: ${pipeline.durationMs ?? '...'}ms`,
    `Steps: ${pipeline.steps.length}`,
    '',
  ]

  for (const step of pipeline.steps) {
    const statusIcon = step.status === 'success' ? '+' : step.status === 'error' ? 'X' : step.status === 'warn' ? '!' : '>'
    lines.push(`  [${statusIcon}] ${step.elapsedMs}ms  ${step.step}${step.error ? ` — ${step.error?.message ?? step.error}` : ''}`)
  }

  if (pipeline.summary) {
    lines.push('')
    lines.push(`Summary: ${pipeline.summary.stepCount} steps, ${pipeline.summary.errorCount} errors, ${pipeline.summary.warnCount} warnings`)
    if (pipeline.summary.eventId) lines.push(`Event ID: ${pipeline.summary.eventId}`)
    if (pipeline.summary.recipientCount != null) lines.push(`Recipients: ${pipeline.summary.recipientCount}`)
  }

  return lines.join('\n')
}
