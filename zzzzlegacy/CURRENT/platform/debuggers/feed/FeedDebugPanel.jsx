// debuggers/feed/FeedDebugPanel.jsx
// ============================================================
// Feed Visibility Debug Panel — DEV-ONLY
// Fixed left-bottom panel showing feed pipeline state.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { getFeedDebugState, subscribeFeedDebug, clearFeedDebugState } from './store.js'

const REASON_COLORS = {
  visible_user: '#4ade80',
  visible_vport: '#4ade80',
  ALLOWED: '#4ade80',
  blocked_actor: '#f87171',
  missing_actor: '#f87171',
  missing_profile: '#f87171',
  inactive_vport: '#fbbf24',
  private_not_following: '#fbbf24',
  FILTERED_HIDDEN: '#fbbf24',
  unknown: '#94a3b8',
}

function Badge({ reason }) {
  const color = REASON_COLORS[reason] ?? '#94a3b8'
  return (
    <span style={{
      color,
      fontSize: 9,
      fontWeight: 600,
      padding: '1px 4px',
      borderRadius: 3,
      background: color + '22',
    }}>
      {reason}
    </span>
  )
}

export default function FeedDebugPanel() {
  if (!import.meta.env.DEV) return null

  const [state, setState] = useState(getFeedDebugState)
  const [minimized, setMinimized] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    setState(getFeedDebugState())
    return subscribeFeedDebug(() => setState(getFeedDebugState()))
  }, [])

  const copyAll = useCallback(() => {
    try { navigator.clipboard.writeText(JSON.stringify(state, null, 2)) } catch (_) {}
  }, [state])

  if (minimized) {
    const fc = state.feed?.filteredCount ?? 0
    const rc = state.feed?.rawCount ?? 0
    return (
      <button
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed', bottom: 80, left: 10, zIndex: 99997,
          background: '#0d1117', color: '#60a5fa', border: '1px solid #1a2a3a44',
          borderRadius: 999, padding: '4px 12px', fontSize: 11,
          fontFamily: "'SF Mono', monospace", boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          cursor: 'pointer', opacity: 0.85,
        }}
      >
        FD {rc > 0 ? `${fc}/${rc}` : ''}
      </button>
    )
  }

  const { viewer, feed, decisions, events } = state
  const visibleCount = decisions.filter(d => d.visible).length
  const filteredCount = decisions.filter(d => !d.visible).length

  return (
    <div style={{
      position: 'fixed', bottom: 10, left: 10, width: 360, maxHeight: '70vh',
      background: '#0d1117', border: '1px solid #1a2a3a', borderRadius: 8,
      color: '#e2e8f0', fontFamily: "'SF Mono', monospace", fontSize: 11,
      zIndex: 99997, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #1a2a3a' }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: '#60a5fa', letterSpacing: 1 }}>FEED DEBUG</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={clearFeedDebugState} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 10 }}>clear</button>
          <button onClick={copyAll} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 10 }}>copy</button>
          <button onClick={() => setMinimized(true)} style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>_</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1a2a3a' }}>
        {['overview', 'decisions', 'events'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '4px 0', background: tab === t ? '#1e293b' : 'transparent',
            border: 'none', color: tab === t ? '#60a5fa' : '#475569', cursor: 'pointer', fontSize: 10, fontWeight: 600,
          }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{ maxHeight: 'calc(70vh - 70px)', overflowY: 'auto', padding: '8px 10px' }}>
        {tab === 'overview' && (
          <>
            {/* Viewer */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: 10, marginBottom: 4 }}>VIEWER</div>
              {viewer ? (
                <div style={{ fontSize: 10, lineHeight: 1.6 }}>
                  <Row label="session" val={viewer.sessionUserId?.slice(0, 12)} />
                  <Row label="actor" val={viewer.actorId?.slice(0, 12)} />
                  <Row label="kind" val={viewer.actorKind} />
                  <Row label="name" val={viewer.displayName} />
                  <Row label="realm" val={viewer.realmId?.slice(0, 12)} />
                  <Row label="complete" val={viewer.isComplete} bool />
                </div>
              ) : <div style={{ color: '#475569' }}>No viewer context</div>}
            </div>

            {/* Feed stats */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: 10, marginBottom: 4 }}>FEED RESULT</div>
              {feed ? (
                <div style={{ fontSize: 10, lineHeight: 1.6 }}>
                  <Row label="raw from DB" val={feed.rawCount} />
                  <Row label="after filter" val={feed.filteredCount} />
                  <Row label="rendered" val={feed.renderedCount} />
                  <Row label="hidden by me" val={feed.hiddenByMeCount} />
                  <Row label="hasMore" val={feed.hasMore} bool />
                </div>
              ) : <div style={{ color: '#475569' }}>No feed data</div>}
            </div>

            {/* Summary */}
            <div>
              <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: 10, marginBottom: 4 }}>VISIBILITY</div>
              <div style={{ fontSize: 10 }}>
                <span style={{ color: '#4ade80' }}>{visibleCount} visible</span>
                {' / '}
                <span style={{ color: '#f87171' }}>{filteredCount} filtered</span>
                {' / '}
                <span style={{ color: '#94a3b8' }}>{decisions.length} total</span>
              </div>
            </div>
          </>
        )}

        {tab === 'decisions' && (
          <div>
            {decisions.length === 0 ? (
              <div style={{ color: '#475569', textAlign: 'center', padding: '16px 0' }}>No decisions</div>
            ) : decisions.map((d, i) => (
              <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: d.visible ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                    {d.postId?.slice(0, 8) ?? '?'}
                  </span>
                  <span style={{ color: '#475569', marginLeft: 6, fontSize: 9 }}>
                    {d.actorKind ?? '?'}
                  </span>
                </div>
                <Badge reason={d.reason} />
              </div>
            ))}
          </div>
        )}

        {tab === 'events' && (
          <div>
            {events.length === 0 ? (
              <div style={{ color: '#475569', textAlign: 'center', padding: '16px 0' }}>No events</div>
            ) : events.slice(0, 30).map((ev, i) => (
              <div key={i} style={{ padding: '2px 0', borderBottom: i > 0 ? '1px solid #111827' : 'none', fontSize: 10 }}>
                <span style={{ color: ev.status === 'error' ? '#f87171' : ev.status === 'success' ? '#4ade80' : '#94a3b8', fontWeight: 600 }}>
                  {ev.step}
                </span>
                {ev.message && <span style={{ color: '#475569', marginLeft: 6 }}>{ev.message}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, val, bool }) {
  if (val === undefined || val === null) {
    return <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#475569' }}>{label}</span><span style={{ color: '#334155' }}>—</span></div>
  }
  const color = bool ? (val ? '#4ade80' : '#f87171') : '#94a3b8'
  const text = bool ? (val ? 'YES' : 'NO') : String(val)
  return <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#475569' }}>{label}</span><span style={{ color, fontWeight: bool ? 600 : 400 }}>{text}</span></div>
}
