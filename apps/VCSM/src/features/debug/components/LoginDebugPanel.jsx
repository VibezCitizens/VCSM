// src/features/debug/components/LoginDebugPanel.jsx
// ============================================================
// VCSM — Floating Login Debug Panel
// Style: matches SUBSCRIBE DEBUG panel (dark bg, neon text, JSON dump)
// DEV-ONLY. Never renders in production.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import {
  getLoginDebugState,
  subscribeLoginDebug,
  clearLoginDebugEvents,
  isLoginDebugEnabled,
  setLoginDebugEnabled,
} from '../loginDebug.store'

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

  // Show recent event history as compact list
  if (state.events.length > 1) {
    dump.history = state.events.slice(0, 15).map((e) => {
      const entry = { step: e.step, status: e.status }
      if (e.durationMs != null) entry.ms = e.durationMs
      if (e.payload) entry.data = e.payload
      if (e.error) entry.error = e.error
      return entry
    })
  }

  return dump
}

export default function LoginDebugPanel() {
  if (!import.meta.env.DEV) return null

  const [state, setState] = useState(getLoginDebugState)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    return subscribeLoginDebug(() => setState(getLoginDebugState()))
  }, [])

  const enabled = isLoginDebugEnabled()

  const copyAsJSON = useCallback(() => {
    try {
      navigator.clipboard.writeText(JSON.stringify(buildJsonDump(state), null, 2))
    } catch (_) {}
  }, [state])

  if (!visible) return null

  const dump = buildJsonDump(state)

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        width: 340,
        maxHeight: '85vh',
        background: '#0d1117',
        border: '1px solid #1a3a2a',
        borderRadius: 8,
        color: '#4ade80',
        fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontSize: 12,
        zIndex: 99999,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header bar — matches SUBSCRIBE DEBUG style */}
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
          LOGIN DEBUG
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={clearLoginDebugEvents}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11 }}
            title="Clear"
          >
            clear
          </button>
          <button
            onClick={copyAsJSON}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11 }}
            title="Copy"
          >
            copy
          </button>
          <button
            onClick={() => setVisible(false)}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 14, fontWeight: 700, lineHeight: 1 }}
          >
            x
          </button>
        </div>
      </div>

      {/* JSON dump body — raw like the screenshot */}
      <div style={{ maxHeight: 'calc(85vh - 40px)', overflowY: 'auto', padding: '10px 14px' }}>
        {state.events.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: 11, padding: '20px 0', textAlign: 'center' }}>
            Waiting for login events...
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
  )
}
