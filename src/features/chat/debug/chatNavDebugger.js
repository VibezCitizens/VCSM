// src/features/chat/debug/chatNavDebugger.js
// ============================================================
// Chat Navigation Debugger
// ------------------------------------------------------------
// - Pure client-side debugger (no IO)
// - Creates a "run" per navigation and logs an ordered timeline
// - Use from screens/hooks to track why state changes happen
//
// Usage:
//   import { chatNavDbg } from '@/features/chat/debug/chatNavDebugger'
//
//   const runId = chatNavDbg.startRun('InboxScreen -> Conversation', { ...meta })
//   chatNavDbg.mark(runId, 'something happened', { ...data })
//   chatNavDbg.endRun(runId, 'done')
//
// Toggle:
//   window.__CHAT_NAV_DEBUG = true/false
// ============================================================

function nowMs() {
  // perf gives better relative timing
  if (typeof performance !== 'undefined' && performance.now) return performance.now()
  return Date.now()
}

function iso() {
  try {
    return new Date().toISOString()
  } catch {
    return ''
  }
}

function safeJson(v) {
  try {
    return JSON.parse(JSON.stringify(v))
  } catch {
    return v
  }
}

function isEnabled() {
  // default ON if not set, you can flip at runtime
  if (typeof window === 'undefined') return true
  if (typeof window.__CHAT_NAV_DEBUG === 'boolean') return window.__CHAT_NAV_DEBUG
  return true
}

function shortId() {
  return Math.random().toString(16).slice(2, 8)
}

const runs = new Map()
// runId -> { id, name, startedAtIso, startedAtMs, marks: [{t,label,data}], lastMs }

function fmtDelta(baseMs, tMs) {
  const d = tMs - baseMs
  return `${d.toFixed(1)}ms`
}

function logGroup(run, label, data) {
  if (!isEnabled()) return
  const t = nowMs()
  const delta = fmtDelta(run.startedAtMs, t)
  const header = `[NAVDBG][${run.id}] +${delta} ${label}`

  // group collapsed to keep console clean
  // but still easy to expand
  console.groupCollapsed(header)
  if (data !== undefined) console.log('data:', safeJson(data))
  console.log('run:', { name: run.name, startedAt: run.startedAtIso })
  console.groupEnd()
}

export const chatNavDbg = {
  startRun(name, meta = {}) {
    if (!isEnabled()) return null

    const id = `${shortId()}-${shortId()}`
    const startedAtMs = nowMs()
    const run = {
      id,
      name: name || 'run',
      startedAtIso: iso(),
      startedAtMs,
      lastMs: startedAtMs,
      marks: [],
    }

    runs.set(id, run)

    console.groupCollapsed(
      `%c[NAVDBG][${id}] START: ${run.name}`,
      'color:#60a5fa;font-weight:bold'
    )
    console.log('startedAt:', run.startedAtIso)
    console.log('meta:', safeJson(meta))
    console.groupEnd()

    return id
  },

  mark(runId, label, data) {
    if (!isEnabled()) return
    if (!runId) return

    const run = runs.get(runId)
    if (!run) return

    const t = nowMs()
    run.lastMs = t
    run.marks.push({ t, label, data: safeJson(data) })

    logGroup(run, label, data)
  },

  snapshot(runId, label, fn) {
    // convenience: compute expensive stuff only when enabled
    if (!isEnabled()) return
    if (!runId) return
    const run = runs.get(runId)
    if (!run) return

    let data
    try {
      data = fn?.()
    } catch (e) {
      data = { __error: true, message: e?.message, stack: e?.stack }
    }
    this.mark(runId, label, data)
  },

  endRun(runId, label = 'END', data) {
    if (!isEnabled()) return
    if (!runId) return

    const run = runs.get(runId)
    if (!run) return

    const total = fmtDelta(run.startedAtMs, nowMs())

    console.groupCollapsed(
      `%c[NAVDBG][${run.id}] ${label} (total ${total})`,
      'color:#34d399;font-weight:bold'
    )

    if (data !== undefined) console.log('data:', safeJson(data))

    console.log('summary:', {
      id: run.id,
      name: run.name,
      startedAt: run.startedAtIso,
      marks: run.marks.length,
    })

    // show an ordered list to read as a timeline
    console.table(
      run.marks.map((m) => ({
        t: fmtDelta(run.startedAtMs, m.t),
        label: m.label,
        data: m.data ? JSON.stringify(m.data).slice(0, 180) : '',
      }))
    )

    console.groupEnd()
    runs.delete(runId)
  },
}
