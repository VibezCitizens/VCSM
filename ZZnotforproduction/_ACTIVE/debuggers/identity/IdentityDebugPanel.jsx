// debuggers/identity/IdentityDebugPanel.jsx
// ============================================================
// Floating Identity Debug Panel
// DEV-ONLY. Never renders in production.
// Style: dark bg, neon green mono text, JSON dump.
// Persisted via sessionStorage — survives lazy-load race.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getIdentityDebugState,
  subscribeIdentityDebug,
  clearIdentityDebugEvents,
} from './store.js'

const STATUS_COLORS = {
  success: '#4ade80',
  error: '#f87171',
  warn: '#fbbf24',
  start: '#60a5fa',
  info: '#94a3b8',
}

function buildJsonDump(state) {
  const latest = state.events[0] ?? null
  const dump = {}

  if (latest) {
    dump.at = latest.at
    dump.step = latest.step
    dump.status = latest.status
    if (latest.message) dump.message = latest.message
    if (latest.durationMs != null) dump.durationMs = latest.durationMs
    if (latest.error) dump.error = latest.error
    if (latest.payload) dump.payload = latest.payload
  }

  if (state.sessionSnapshot) dump.session = state.sessionSnapshot
  if (state.identitySnapshot) dump.identity = state.identitySnapshot

  if (state.events.length > 1) {
    dump.history = state.events.slice(0, 20).map((e) => {
      const entry = { step: e.step, status: e.status }
      if (e.durationMs != null) entry.ms = e.durationMs
      if (e.payload) entry.data = e.payload
      if (e.error) entry.error = e.error
      return entry
    })
  }

  return dump
}

export default function IdentityDebugPanel() {
  if (!import.meta.env.DEV) return null

  const [state, setState] = useState(getIdentityDebugState)
  const [minimized, setMinimized] = useState(true)
  const [railTarget, setRailTarget] = useState(null)

  useEffect(() => {
    setState(getIdentityDebugState())
    return subscribeIdentityDebug(() => setState(getIdentityDebugState()))
  }, [])

  useEffect(() => {
    setRailTarget(document.getElementById('debug-rail-right'))
  }, [])

  const copyAsJSON = useCallback(() => {
    try {
      navigator.clipboard.writeText(JSON.stringify(buildJsonDump(state), null, 2))
    } catch (_) {}
  }, [state])

  if (!railTarget) return null

  const dump = buildJsonDump(state)
  const latestStatus = state.events[0]?.status ?? 'info'

  return createPortal(
    <div>
  {minimized ? (
    <button
      onClick={() => setMinimized(false)}
      style={{
        background: '#0d1117', color: '#4ade80', border: '1px solid #1a3a2a',
        borderRadius: 999, padding: '4px 12px', fontSize: 11,
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)', cursor: 'pointer', opacity: 0.85,
      }}
    >
      ID {state.events.length > 0 ? `(${state.events.length})` : ''}
    </button>
  ) : (
    <div
      style={{
        width: 360, maxHeight: '85vh',
        background: '#0d1117',
        border: `1px solid ${STATUS_COLORS[latestStatus] ?? '#1a3a2a'}44`,
        borderRadius: 8, color: '#4ade80',
        fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontSize: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid #1a3a2a',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: '#4ade80', letterSpacing: 1 }}>
          IDENTITY DEBUG
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={clearIdentityDebugEvents}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11 }}
            title="Clear events"
          >
            clear
          </button>
          <button
            onClick={copyAsJSON}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11 }}
            title="Copy as JSON"
          >
            copy
          </button>
          <button
            onClick={() => setMinimized(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fbbf24',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1,
            }}
            title="Minimize"
          >
            _
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxHeight: 'calc(85vh - 40px)', overflowY: 'auto', padding: '10px 14px' }}>
        {state.events.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: 11, padding: '20px 0', textAlign: 'center' }}>
            Waiting for identity events...
          </div>
        ) : (
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              fontSize: 11,
              lineHeight: 1.6,
              color: '#4ade80',
            }}
          >
            {JSON.stringify(dump, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )}
    </div>,
    railTarget
  )
}
