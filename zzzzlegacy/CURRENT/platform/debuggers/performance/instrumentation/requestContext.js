// debuggers/performance/instrumentation/requestContext.js
// Request ID generation and correlation for tracing queries back to page loads.

let _counter = 0
let _activeContext = null

export function generateRequestId() {
  _counter++
  return `req_${Date.now()}_${_counter}`
}

export function startRequestContext({ route, trigger }) {
  _activeContext = {
    id: generateRequestId(),
    route,
    trigger,
    startedAt: performance.now(),
    timestamp: new Date().toISOString(),
  }
  return _activeContext
}

export function getActiveContext() {
  return _activeContext
}

export function endRequestContext() {
  const ctx = _activeContext
  _activeContext = null
  return ctx
}

export function withRequestContext(route, trigger, fn) {
  const ctx = startRequestContext({ route, trigger })
  const result = fn(ctx)
  if (result && typeof result.then === 'function') {
    return result.finally(() => endRequestContext())
  }
  endRequestContext()
  return result
}
