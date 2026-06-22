// debuggers/performance/PerfOverlay.jsx
// Floating dev-only performance overlay.
// Shows live query/request summary on every page.
// Collapsible, draggable position, elegant dark theme.
// Never renders in production.

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { getPerfState, subscribePerfStore, toggleRecording, isRecording, clearPerfStore } from './store.js'
import { generateRecommendations } from './analysis/recommendations.js'
import { detectDuplicateQueries } from './analysis/overfetch.js'
import { copySnapshot } from './logger.js'
import { SEVERITY_COLORS, THRESHOLDS } from './constants.js'

const PANEL_WIDTH = 340
const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"

export default function PerfOverlay() {
  if (!import.meta.env.DEV) return null

  const state = useSyncExternalStore(subscribePerfStore, getPerfState)
  const [minimized, setMinimized] = useState(true)
  const [railTarget, setRailTarget] = useState(null)

  useEffect(() => {
    setRailTarget(document.getElementById('debug-rail-left'))
  }, [])

  const currentRoute = typeof window !== 'undefined' ? window.location.pathname : '/'

  // Live stats
  const stats = useMemo(() => {
    const routeQueries = state.dbQueries.filter((q) => q.route === currentRoute)
    const routeApi = state.apiRequests.filter((r) => r.route === currentRoute)
    const totalDbMs = routeQueries.reduce((s, q) => s + q.durationMs, 0)
    const totalApiMs = routeApi.reduce((s, r) => s + r.durationMs, 0)
    const slowQueries = routeQueries.filter((q) => q.severity !== 'ok')
    const duplicates = detectDuplicateQueries(routeQueries)
    const recs = generateRecommendations({
      dbQueries: routeQueries,
      apiRequests: routeApi,
      pageLoads: state.pageLoads.filter((p) => p.route === currentRoute),
      imageLoads: state.imageLoads,
    })
    const critCount = recs.filter((r) => r.priority === 'critical').length
    const highCount = recs.filter((r) => r.priority === 'high').length

    return {
      queryCount: routeQueries.length,
      apiCount: routeApi.length,
      totalDbMs,
      totalApiMs,
      slowCount: slowQueries.length,
      dupCount: duplicates.length,
      recCount: recs.length,
      critCount,
      highCount,
      worstSeverity: critCount > 0 ? 'critical' : highCount > 0 ? 'warning' : slowQueries.length > 0 ? 'warning' : 'ok',
    }
  }, [state, currentRoute])

  if (!railTarget) return null

  const color = SEVERITY_COLORS[stats.worstSeverity]

  return createPortal(
    <div>
  {minimized ? (
    <button
      onClick={() => setMinimized(false)}
      style={{
        background: '#0d1117', color,
        border: `1px solid ${color}44`, borderRadius: 999, padding: '4px 12px',
        fontSize: 11, fontFamily: MONO,
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)', cursor: 'pointer', opacity: 0.9,
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      PERF
      <span style={{ color: '#64748b', fontSize: 10 }}>
        {stats.queryCount}q {Math.round(stats.totalDbMs)}ms
      </span>
    </button>
  ) : (
    <div style={{
      width: PANEL_WIDTH,
      maxHeight: '70vh',
      background: '#0d1117',
      border: `1px solid ${SEVERITY_COLORS[stats.worstSeverity]}33`,
      borderRadius: 10,
      fontFamily: MONO,
      fontSize: 11,
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid #1e293b',
        background: '#161b22',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: isRecording() ? '#4ade80' : '#64748b',
            display: 'inline-block',
            animation: isRecording() ? 'pulse-dot 2s ease infinite' : 'none',
          }} />
          <span style={{ fontWeight: 700, fontSize: 12, color: '#e2e8f0', letterSpacing: 0.5 }}>
            PERF MONITOR
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={toggleRecording} style={btnStyle} title={isRecording() ? 'Pause' : 'Record'}>
            {isRecording() ? '\u23F8' : '\u25B6'}
          </button>
          <button onClick={copySnapshot} style={btnStyle} title="Copy JSON">CPY</button>
          <button onClick={clearPerfStore} style={btnStyle} title="Clear">CLR</button>
          <button
            onClick={() => setMinimized(true)}
            style={{ ...btnStyle, color: '#fbbf24', fontWeight: 700 }}
            title="Minimize"
          >
            _
          </button>
        </div>
      </div>

      {/* Route */}
      <div style={{
        padding: '6px 12px',
        fontSize: 10,
        color: '#64748b',
        borderBottom: '1px solid #1e293b',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        Route: <span style={{ color: '#94a3b8' }}>{currentRoute}</span>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#1e293b' }}>
        <StatCell label="DB Queries" value={stats.queryCount} severity={stats.queryCount > 20 ? 'warning' : 'ok'} />
        <StatCell label="DB Time" value={`${Math.round(stats.totalDbMs)}ms`} severity={stats.totalDbMs > THRESHOLDS.QUERY_CRITICAL_MS ? 'critical' : stats.totalDbMs > THRESHOLDS.QUERY_WARNING_MS ? 'warning' : 'ok'} />
        <StatCell label="API Calls" value={stats.apiCount} severity={stats.apiCount > 10 ? 'warning' : 'ok'} />
        <StatCell label="API Time" value={`${Math.round(stats.totalApiMs)}ms`} severity={stats.totalApiMs > THRESHOLDS.API_CRITICAL_MS ? 'critical' : 'ok'} />
        <StatCell label="Duplicates" value={stats.dupCount} severity={stats.dupCount > 0 ? 'warning' : 'ok'} />
        <StatCell label="Slow Ops" value={stats.slowCount} severity={stats.slowCount > 0 ? 'critical' : 'ok'} />
      </div>

      {/* Issues summary */}
      {stats.recCount > 0 && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid #1e293b' }}>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>ISSUES DETECTED</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {stats.critCount > 0 && (
              <IssueBadge count={stats.critCount} label="critical" color={SEVERITY_COLORS.critical} />
            )}
            {stats.highCount > 0 && (
              <IssueBadge count={stats.highCount} label="high" color="#fb923c" />
            )}
            {stats.recCount - stats.critCount - stats.highCount > 0 && (
              <IssueBadge
                count={stats.recCount - stats.critCount - stats.highCount}
                label="other"
                color="#64748b"
              />
            )}
          </div>
        </div>
      )}

      {/* Recent slow queries */}
      {stats.slowCount > 0 && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid #1e293b', maxHeight: 200, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>SLOW OPERATIONS</div>
          {state.dbQueries
            .filter((q) => q.route === currentRoute && q.severity !== 'ok')
            .slice(0, 8)
            .map((q) => (
              <div key={q.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '3px 0',
                borderBottom: '1px solid #1e293b44',
              }}>
                <span style={{
                  color: '#94a3b8',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 200,
                  fontSize: 10,
                }}>
                  {q.queryName}
                </span>
                <span style={{
                  color: SEVERITY_COLORS[q.severity],
                  fontWeight: 600,
                  fontSize: 10,
                  flexShrink: 0,
                }}>
                  {Math.round(q.durationMs)}ms
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Link to dashboard */}
      <a
        href="/dev/performance"
        style={{
          display: 'block',
          padding: '8px 12px',
          borderTop: '1px solid #1e293b',
          fontSize: 10,
          color: '#a78bfa',
          textDecoration: 'none',
          textAlign: 'center',
        }}
      >
        Open Full Dashboard \u2192
      </a>
    </div>
  )}
    </div>,
    railTarget
  )
}

function StatCell({ label, value, severity = 'ok' }) {
  const color = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.ok
  return (
    <div style={{ background: '#0d1117', padding: '8px 12px' }}>
      <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color, lineHeight: 1.3 }}>
        {value}
      </div>
    </div>
  )
}

function IssueBadge({ count, label, color }) {
  return (
    <span style={{
      background: color + '15',
      color,
      border: `1px solid ${color}33`,
      borderRadius: 4,
      padding: '1px 6px',
      fontSize: 9,
      fontWeight: 600,
      fontFamily: MONO,
    }}>
      {count} {label}
    </span>
  )
}

const btnStyle = {
  background: 'none',
  border: 'none',
  color: '#64748b',
  cursor: 'pointer',
  fontSize: 11,
  padding: '2px 4px',
  fontFamily: MONO,
}
