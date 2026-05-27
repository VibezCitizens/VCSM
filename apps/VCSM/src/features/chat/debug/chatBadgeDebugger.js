// src/features/chat/debug/chatBadgeDebugger.js
// ============================================================
// Chat Badge Debugger — dev-only runtime observability
// ------------------------------------------------------------
// Tracks the badge pipeline: fetch timing, count changes,
// and cache invalidation events.
//
// Toggle: window.__CHAT_BADGE_DEBUG = true / false
// Default: ON in dev, OFF in prod (guarded at call sites).
// ============================================================

function nowMs() {
  if (typeof performance !== 'undefined' && performance.now) return performance.now()
  return Date.now()
}

function isEnabled() {
  if (typeof window === 'undefined') return false
  if (typeof window.__CHAT_BADGE_DEBUG === 'boolean') return window.__CHAT_BADGE_DEBUG
  return true
}

// Last known badge count per actorId — for change detection.
const _lastCount = new Map()

export const chatBadgeDbg = {
  /** Call before the DB fetch. Returns an opaque timing token. */
  startFetch(actorId) {
    if (!isEnabled()) return null
    return { actorId, t0: nowMs() }
  },

  /** Call after fetch resolves with the badge count. */
  endFetch(token, count) {
    if (!isEnabled() || !token) return
    const elapsed = (nowMs() - token.t0).toFixed(1)
    const prev = _lastCount.get(token.actorId) ?? null
    const changed = prev !== null && prev !== count

    if (changed) {
      console.groupCollapsed(
        `%c[BADGE] ${token.actorId?.slice(0, 8)} CHANGED ${prev} → ${count} (+${elapsed}ms)`,
        'color:#f59e0b;font-weight:bold'
      )
    } else {
      console.groupCollapsed(
        `[BADGE] ${token.actorId?.slice(0, 8)} ${count} (+${elapsed}ms)`
      )
    }
    console.log('actorId:', token.actorId, '| elapsed:', elapsed + 'ms', '| count:', count)
    console.groupEnd()

    _lastCount.set(token.actorId, count)
  },

  /** Call on fetch error (after LF-01 logging, for timing context). */
  endFetchError(token) {
    if (!isEnabled() || !token) return
    const elapsed = (nowMs() - token.t0).toFixed(1)
    console.groupCollapsed(
      `%c[BADGE] ${token.actorId?.slice(0, 8)} ERROR (+${elapsed}ms)`,
      'color:#f87171;font-weight:bold'
    )
    console.log('actorId:', token.actorId, '| elapsed:', elapsed + 'ms')
    console.groupEnd()
  },

  /** Log an imperative cache invalidation event. */
  invalidate(reason = 'unknown') {
    if (!isEnabled()) return
    console.groupCollapsed(`%c[BADGE] invalidate — ${reason}`, 'color:#a78bfa')
    console.groupEnd()
  },
}
