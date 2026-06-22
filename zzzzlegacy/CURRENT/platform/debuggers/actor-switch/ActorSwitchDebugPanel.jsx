// debuggers/actor-switch/ActorSwitchDebugPanel.jsx
// ============================================================
// Floating Actor Switch Debug Panel
// DEV-ONLY. Shows full switch pipeline per attempt.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getSwitchDebugState,
  subscribeSwitchDebug,
  clearSwitchDebugState,
  isSwitchDebugEnabled,
} from './store.js'

const FALLBACK_COLORS = {
  exact:         '#4ade80',
  name:          '#fbbf24',
  'single-link': '#f97316',
  null:          '#94a3b8',
}

function ResolutionCard({ r }) {
  const isAborted = r.aborted
  const fallbackColor = isAborted ? '#f87171' : (FALLBACK_COLORS[r.fallback] ?? '#94a3b8')
  const label = isAborted ? 'ABORTED' : (r.fallback ?? 'unknown').toUpperCase()

  return (
    <div style={{ padding: '6px 0', borderBottom: '1px solid #1a2a3a', fontSize: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: fallbackColor, fontWeight: 700 }}>{label}</span>
        <span style={{ color: '#475569' }}>{r.at?.split('T')[1]?.slice(0, 8)}</span>
      </div>
      <div style={{ color: '#64748b', marginTop: 2 }}>
        clicked: <span style={{ color: '#e2e8f0' }}>{r.clickedId?.slice(0, 8) ?? '?'}</span>
        {r.profileName && <span style={{ color: '#94a3b8' }}> ({r.profileName})</span>}
      </div>
      {!isAborted && (
        <div style={{ color: '#64748b' }}>
          resolved: <span style={{ color: fallbackColor }}>{r.resolvedId?.slice(0, 8) ?? '?'}</span>
          {r.clickedId !== r.resolvedId && (
            <span style={{ color: '#f87171', marginLeft: 4 }}>← MISMATCH</span>
          )}
        </div>
      )}
      {isAborted && (
        <div style={{ color: '#94a3b8', marginTop: 2 }}>
          available: {r.availableVportIds.map(id => id.slice(0, 8)).join(', ') || 'none'}
        </div>
      )}
    </div>
  )
}

const VERDICT_COLORS = {
  fully_successful: '#4ade80',
  optimistic_only: '#fbbf24',
  failed_before_hydration: '#f87171',
  failed_after_platform_write: '#f87171',
  unknown: '#94a3b8',
}

const STATUS_BADGE = {
  success: { bg: '#166534', color: '#4ade80' },
  error: { bg: '#7f1d1d', color: '#f87171' },
  warn: { bg: '#713f12', color: '#fbbf24' },
  info: { bg: '#1e293b', color: '#94a3b8' },
  start: { bg: '#1e3a5f', color: '#60a5fa' },
}

function Badge({ status }) {
  const s = STATUS_BADGE[status] ?? STATUS_BADGE.info
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      padding: '1px 6px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 600,
      marginRight: 6,
    }}>
      {status}
    </span>
  )
}

function AttemptCard({ attempt, isExpanded, onToggle }) {
  const verdict = attempt.verdict ?? 'unknown'
  const verdictColor = VERDICT_COLORS[verdict] ?? '#94a3b8'
  const snap = attempt.snapshot

  return (
    <div style={{
      borderBottom: '1px solid #1a2a3a',
      padding: '8px 0',
    }}>
      {/* Header */}
      <div
        onClick={onToggle}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <span style={{ color: verdictColor, fontWeight: 700, fontSize: 11 }}>
            {verdict.toUpperCase().replace(/_/g, ' ')}
          </span>
          <span style={{ color: '#64748b', fontSize: 10, marginLeft: 8 }}>
            {attempt.entryPoint}
          </span>
        </div>
        <span style={{ color: '#475569', fontSize: 10 }}>
          {attempt.startedAt?.split('T')[1]?.slice(0, 8) ?? ''}
          {' '}{isExpanded ? '▾' : '▸'}
        </span>
      </div>

      {/* Actor summary row */}
      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
        {attempt.previousActorId?.slice(0, 8) ?? '?'}
        <span style={{ color: '#4ade80', margin: '0 4px' }}>→</span>
        {attempt.requestedActorId?.slice(0, 8) ?? '?'}
        {snap?.finalActorId && snap.finalActorId !== attempt.requestedActorId && (
          <span style={{ color: '#f87171', marginLeft: 4 }}>
            (got {snap.finalActorId.slice(0, 8)})
          </span>
        )}
      </div>

      {isExpanded && (
        <div style={{ marginTop: 8 }}>
          {/* Snapshot summary */}
          {snap && (
            <div style={{ marginBottom: 8, padding: '6px 8px', background: '#0a0f18', borderRadius: 4, fontSize: 10 }}>
              <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>SWITCH SNAPSHOT</div>
              <Row label="actorKind" val={snap.actorKind} />
              <Row label="userAppAccountId" val={snap.userAppAccountId?.slice(0, 12)} />
              <Row label="actorLinkId" val={snap.actorLinkId?.slice(0, 12)} />
              <Row label="engineCtx" val={snap.engineContextResolved} bool />
              <Row label="linkMatched" val={snap.linkMatched} bool />
              <Row label="platformWrite" val={snap.platformWriteSucceeded} bool />
              <Row label="hydration" val={snap.hydrationSucceeded} bool />
              <Row label="stateUpdated" val={snap.stateUpdated} bool />
              <Row label="localStorage" val={snap.localStorageWritten} bool />
              <Row label="lsRole" val={snap.localStorageRole} />
              <Row label="refreshRestore" val={snap.refreshRestoredSameActor} bool />
            </div>
          )}

          {/* Event timeline */}
          <div style={{ fontSize: 10 }}>
            {attempt.events.map((ev, i) => (
              <div key={i} style={{ padding: '2px 0', borderTop: i > 0 ? '1px solid #111827' : 'none' }}>
                <div>
                  <Badge status={ev.status} />
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{ev.step}</span>
                </div>
                {ev.message && (
                  <div style={{ color: '#64748b', marginLeft: 4, marginTop: 1 }}>{ev.message}</div>
                )}
                {ev.payload && (
                  <pre style={{ color: '#475569', margin: '2px 0 0 4px', fontSize: 9, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(ev.payload, null, 1)}
                  </pre>
                )}
                {ev.error && (
                  <div style={{ color: '#f87171', marginLeft: 4, fontSize: 9 }}>
                    {ev.error.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, val, bool }) {
  if (val === undefined || val === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#475569' }}>{label}</span>
        <span style={{ color: '#334155' }}>—</span>
      </div>
    )
  }
  const color = bool ? (val ? '#4ade80' : '#f87171') : '#94a3b8'
  const text = bool ? (val ? 'YES' : 'NO') : String(val)
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#475569' }}>{label}</span>
      <span style={{ color, fontWeight: bool ? 600 : 400 }}>{text}</span>
    </div>
  )
}

export default function ActorSwitchDebugPanel() {
  if (!import.meta.env.DEV) return null
  if (!isSwitchDebugEnabled()) return null

  const [state, setState] = useState(getSwitchDebugState)
  const [minimized, setMinimized] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [railTarget, setRailTarget] = useState(null)

  useEffect(() => {
    setRailTarget(document.getElementById('debug-rail-left'))
  }, [])

  useEffect(() => {
    setState(getSwitchDebugState())
    return subscribeSwitchDebug(() => {
      const next = getSwitchDebugState()
      setState(next)
      // Auto-expand latest attempt when a new one starts
      if (next.attempts.length > 0) {
        setExpandedId(next.attempts[0].id)
        setMinimized(false)
      }
    })
  }, [])

  const copyAll = useCallback(() => {
    try {
      navigator.clipboard.writeText(JSON.stringify(state, null, 2))
    } catch (_) {}
  }, [state])

  if (!railTarget) return null

  const count = state.attempts.length
  const lastVerdict = state.attempts[0]?.verdict
  const pillColor = VERDICT_COLORS[lastVerdict] ?? '#64748b'

  return createPortal(
    <div>
  {minimized ? (
    <button
      onClick={() => setMinimized(false)}
      style={{
        background: '#0d1117', color: pillColor,
        border: `1px solid ${pillColor}44`, borderRadius: 999, padding: '4px 12px',
        fontSize: 11, fontFamily: "'SF Mono', 'Fira Code', monospace",
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)', cursor: 'pointer', opacity: 0.85,
      }}
    >
      SW {count > 0 ? `(${count})` : ''}
    </button>
  ) : (
    <div
      style={{
        width: 340, maxHeight: '85vh',
        background: '#0d1117', border: '1px solid #1a2a3a', borderRadius: 8,
        color: '#e2e8f0', fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontSize: 12, overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid #1a2a3a',
      }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#60a5fa', letterSpacing: 1 }}>
          ACTOR SWITCH
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={clearSwitchDebugState}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11 }}
          >
            clear
          </button>
          <button
            onClick={copyAll}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11 }}
          >
            copy
          </button>
          <button
            onClick={() => setMinimized(true)}
            style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
          >
            _
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxHeight: 'calc(85vh - 40px)', overflowY: 'auto', padding: '6px 12px' }}>

        {/* Vport Switcher Resolution log — fires BEFORE switchActor */}
        {state.resolutions?.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#f97316',
              letterSpacing: 1,
              marginBottom: 4,
              paddingBottom: 4,
              borderBottom: '1px solid #1a2a3a',
            }}>
              VPORT SWITCHER — resolution layer
            </div>
            {state.resolutions.slice(0, 5).map((r, i) => (
              <ResolutionCard key={i} r={r} />
            ))}
          </div>
        )}

        {/* Switch attempts from identityContext.switchActor */}
        <div style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', letterSpacing: 1, marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid #1a2a3a' }}>
          SWITCH PIPELINE — identityContext
        </div>
        {state.attempts.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: 11, padding: '20px 0', textAlign: 'center' }}>
            No switch attempts yet
          </div>
        ) : (
          state.attempts.map((attempt) => (
            <AttemptCard
              key={attempt.id}
              attempt={attempt}
              isExpanded={expandedId === attempt.id}
              onToggle={() => setExpandedId(expandedId === attempt.id ? null : attempt.id)}
            />
          ))
        )}
      </div>
    </div>
  )}
    </div>,
    railTarget
  )
}
