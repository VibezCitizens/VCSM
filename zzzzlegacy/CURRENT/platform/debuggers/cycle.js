// debuggers/cycle.js
// ============================================================
// Debug Cycle Manager — DEV-ONLY
// Tracks the current auth user and login cycle.
// All debug stores use this to scope their data.
// ============================================================

let _currentUserId = null
let _cycleId = 0
let _onChangeFns = new Set()

/**
 * Call this when auth user changes (including logout → null).
 * Increments the cycle and notifies all stores to clear current snapshots.
 */
export function debugUserChanged(userId) {
  if (!import.meta.env.DEV) return
  if (userId === _currentUserId) return
  _currentUserId = userId
  _cycleId++
  for (const fn of _onChangeFns) {
    try { fn(userId, _cycleId) } catch (_) {}
  }
}

export function getCurrentDebugUserId() {
  return _currentUserId
}

export function getCurrentDebugCycleId() {
  return _cycleId
}

/**
 * Register a callback that fires when the debug user/cycle changes.
 * Used by stores to clear their current snapshots.
 */
export function onDebugUserChange(fn) {
  _onChangeFns.add(fn)
  return () => _onChangeFns.delete(fn)
}

/**
 * Collect all current debug state from all stores for a unified copy.
 * Stores register themselves here.
 */
const _stateCollectors = new Map()

export function registerDebugCollector(name, fn) {
  _stateCollectors.set(name, fn)
}

export function collectAllDebugState() {
  const result = {
    currentUserId: _currentUserId,
    cycleId: _cycleId,
    collectedAt: new Date().toISOString(),
  }
  for (const [name, fn] of _stateCollectors) {
    try { result[name] = fn() } catch (e) { result[name] = { error: e?.message } }
  }
  return result
}
