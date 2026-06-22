// ============================================================
// Feed Profiler Overlay — DEV-ONLY
// ============================================================
// Floating panel that shows DAL read counts, table frequency,
// duplicate warnings, N+1 suspects, and timing breakdown
// for the most recent feed load.

import { useState, useEffect, useSyncExternalStore, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  getLatestFeedSession,
  subscribeFeedProfiler,
  clearFeedSessions,
  formatFeedReport,
} from './feedProfiler.js'

const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"

const SEV = {
  ok: '#4ade80',
  warn: '#fbbf24',
  crit: '#f87171',
  info: '#60a5fa',
  muted: '#475569',
}

export default function FeedProfilerOverlay() {
  if (!import.meta.env.DEV) return null

  const session = useSyncExternalStore(subscribeFeedProfiler, getLatestFeedSession)
  const [minimized, setMinimized] = useState(true)
  const [railTarget, setRailTarget] = useState(null)

  useEffect(() => {
    setRailTarget(document.getElementById('debug-rail-left'))
  }, [])

  const copyReport = useCallback(() => {
    try {
      navigator.clipboard.writeText(formatFeedReport(session))
    } catch (_) {}
  }, [session])

  if (!session || !railTarget) return null

  const s = session.summary
  const isActive = !session.completed
  const color = isActive ? SEV.info : (s?.duplicates?.length > 0 ? SEV.warn : SEV.ok)

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
      FEED
      {s && (
        <span style={{ color: SEV.muted, fontSize: 10 }}>
          {s.dalCallCount}dal {Math.round(s.totalDbMs)}ms
        </span>
      )}
    </button>
  ) : (
    <div style={{
      width: 380,
      maxHeight: '70vh',
      background: '#0d1117',
      border: `1px solid ${isActive ? SEV.info : SEV.ok}33`,
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
            width: 7, height: 7, borderRadius: '50%',
            background: isActive ? SEV.info : SEV.ok,
            display: 'inline-block',
          }} />
          <span style={{ fontWeight: 700, fontSize: 12, color: '#e2e8f0', letterSpacing: 0.5 }}>
            FEED PROFILER
          </span>
          {isActive && <span style={{ color: SEV.info, fontSize: 10 }}>recording...</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={copyReport} style={btnStyle} title="Copy report">CPY</button>
          <button onClick={clearFeedSessions} style={btnStyle} title="Clear">CLR</button>
          <button onClick={() => setMinimized(true)} style={{ ...btnStyle, color: SEV.warn, fontWeight: 700 }}>_</button>
        </div>
      </div>

      {!s ? (
        <div style={{ padding: 20, textAlign: 'center', color: SEV.muted }}>
          {isActive ? 'Feed loading...' : 'Waiting for feed load'}
        </div>
      ) : (
        <div style={{ maxHeight: 'calc(70vh - 44px)', overflowY: 'auto' }}>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: '#1e293b' }}>
            <Stat label="Feed Load" value={`${Math.round(s.feedLoadMs)}ms`} color={s.feedLoadMs > 2000 ? SEV.crit : s.feedLoadMs > 1000 ? SEV.warn : SEV.ok} />
            <Stat label="DB Time" value={`${Math.round(s.totalDbMs)}ms`} color={s.totalDbMs > 1000 ? SEV.crit : SEV.ok} />
            <Stat label="DB %" value={`${Math.round((s.totalDbMs / (s.feedLoadMs || 1)) * 100)}%`} color={SEV.info} />
            <Stat label="DAL Calls" value={s.dalCallCount} color={s.dalCallCount > 15 ? SEV.warn : SEV.ok} />
            <Stat label="Tables" value={s.uniqueTables} color={SEV.ok} />
            <Stat label="Total Rows" value={s.totalRows} color={SEV.ok} />
          </div>

          {/* Warnings */}
          {(s.duplicates.length > 0 || s.nplus1.length > 0) && (
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b' }}>
              {s.duplicates.map((d) => (
                <div key={d.dalName} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Badge color={SEV.warn}>DUP</Badge>
                  <span style={{ color: '#e2e8f0' }}>{d.dalName}</span>
                  <span style={{ color: SEV.muted }}>x{d.callCount} → {d.table}</span>
                </div>
              ))}
              {s.nplus1.map((n) => (
                <div key={n.dalName} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Badge color={SEV.crit}>N+1</Badge>
                  <span style={{ color: '#e2e8f0' }}>{n.dalName}</span>
                  <span style={{ color: SEV.muted }}>x{n.callCount} → {n.table}</span>
                </div>
              ))}
            </div>
          )}

          {/* DAL Methods */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ fontSize: 10, color: SEV.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              DAL Methods (by call count)
            </div>
            {s.dalStats.map((d) => (
              <div key={d.dalName} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '3px 0',
                borderBottom: '1px solid #1e293b22',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, overflow: 'hidden' }}>
                  {d.isDuplicate && <span style={{ color: SEV.warn, fontSize: 9 }}>!</span>}
                  <span style={{ color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.dalName}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <span style={{ color: d.callCount > 1 ? SEV.warn : SEV.muted, fontWeight: 600 }}>x{d.callCount}</span>
                  <span style={{ color: d.avgMs > 300 ? SEV.crit : d.avgMs > 100 ? SEV.warn : SEV.ok, width: 50, textAlign: 'right' }}>
                    {Math.round(d.totalMs)}ms
                  </span>
                  <span style={{ color: SEV.muted, width: 40, textAlign: 'right' }}>{d.totalRows}r</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tables */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ fontSize: 10, color: SEV.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tables (by read frequency)
            </div>
            {s.tableStats.map((t) => (
              <div key={t.table} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '2px 0',
              }}>
                <span style={{ color: '#94a3b8' }}>{t.table}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: t.readCount > 2 ? SEV.warn : SEV.muted, fontWeight: 600 }}>{t.readCount}x</span>
                  <span style={{ color: SEV.muted, width: 50, textAlign: 'right' }}>{Math.round(t.totalMs)}ms</span>
                </div>
              </div>
            ))}
          </div>

          {/* Execution pattern */}
          <div style={{ padding: '8px 12px', fontSize: 10, color: SEV.muted }}>
            Execution: {s.parallelCalls} parallel / {s.serialChains} serial
            {s.serialChains > 3 && (
              <span style={{ color: SEV.warn, marginLeft: 6 }}>
                — consider parallelizing serial chains
              </span>
            )}
          </div>

          {/* Timeline */}
          {session.dalCalls.length > 0 && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid #1e293b' }}>
              <div style={{ fontSize: 10, color: SEV.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Timeline
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {[...session.dalCalls].sort((a, b) => a.startMs - b.startMs).map((c, i) => {
                  const maxMs = s.feedLoadMs || 1
                  const leftPct = (c.startMs / maxMs) * 100
                  const widthPct = Math.max((c.durationMs / maxMs) * 100, 0.5)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, height: 16 }}>
                      <span style={{ width: 100, fontSize: 9, color: SEV.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {c.dalName}
                      </span>
                      <div style={{ flex: 1, position: 'relative', height: 10, background: '#1e293b33', borderRadius: 2 }}>
                        <div style={{
                          position: 'absolute',
                          left: `${Math.min(leftPct, 100)}%`,
                          width: `${Math.min(widthPct, 100 - leftPct)}%`,
                          height: '100%',
                          background: c.error ? SEV.crit : '#a78bfa',
                          borderRadius: 2,
                          opacity: 0.85,
                          minWidth: 2,
                        }} />
                      </div>
                      <span style={{ width: 40, fontSize: 9, color: SEV.muted, textAlign: 'right', flexShrink: 0 }}>
                        {Math.round(c.durationMs)}ms
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )}
    </div>,
    railTarget
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ background: '#0d1117', padding: '6px 10px' }}>
      <div style={{ fontSize: 9, color: SEV.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color, lineHeight: 1.3 }}>{value}</div>
    </div>
  )
}

function Badge({ color, children }) {
  return (
    <span style={{
      background: color + '20',
      color,
      border: `1px solid ${color}44`,
      borderRadius: 4,
      padding: '0 5px',
      fontSize: 8,
      fontWeight: 700,
      fontFamily: MONO,
      flexShrink: 0,
    }}>
      {children}
    </span>
  )
}

const btnStyle = {
  background: 'none',
  border: 'none',
  color: '#64748b',
  cursor: 'pointer',
  fontSize: 10,
  padding: '2px 4px',
  fontFamily: MONO,
}
