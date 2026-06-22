// debuggers/performance/components/ScreenListView.jsx
// Shows all screen traces sorted by most recent, with key metrics per trace.

import { SEVERITY_COLORS } from '../constants.js'

const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"

const CORE_ROUTES = ['/feed', '/chat', '/notifications', '/explore', '/upload', '/settings', '/profile']

export default function ScreenListView({ traces, onSelectTrace }) {
  if (!traces || traces.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#475569', fontSize: 11, fontFamily: MONO }}>
        No screen traces captured yet. Navigate the app to see route loads.
      </div>
    )
  }

  // Build coverage map
  const tracedRoutes = new Set()
  const settledRoutes = new Set()
  for (const t of traces) {
    if (!t.completed || !t.summary) continue
    tracedRoutes.add(t.summary.route)
    if (t.summary.hasLoadSettled) settledRoutes.add(t.summary.route)
  }

  return (
    <div>
      {/* Trace coverage status */}
      <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, padding: '12px 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', fontFamily: MONO, marginBottom: 8 }}>
          Trace Coverage
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CORE_ROUTES.map((route) => {
            const isTraced = [...tracedRoutes].some((r) => r.startsWith(route))
            const isSettled = [...settledRoutes].some((r) => r.startsWith(route))
            return (
              <span key={route} style={{
                background: isSettled ? '#4ade8015' : isTraced ? '#fbbf2415' : '#f8717110',
                border: `1px solid ${isSettled ? '#4ade8033' : isTraced ? '#fbbf2433' : '#f8717122'}`,
                borderRadius: 4, padding: '2px 8px', fontSize: 10, fontFamily: MONO,
                color: isSettled ? '#4ade80' : isTraced ? '#fbbf24' : '#f87171',
              }}>
                {route} {isSettled ? '\u2713' : isTraced ? '\u25CB' : '\u2717'}
              </span>
            )
          })}
        </div>
        <div style={{ fontSize: 9, color: '#475569', fontFamily: MONO, marginTop: 6 }}>
          {'\u2713'} = fully traced (load settled) &nbsp; {'\u25CB'} = traced (no settle signal) &nbsp; {'\u2717'} = not visited yet
        </div>
      </div>

      {/* Source type legend */}
      <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 16, fontSize: 10, fontFamily: MONO, color: '#64748b' }}>
          <span><span style={{ color: '#4ade80' }}>screen_load</span> = during initial render</span>
          <span><span style={{ color: '#60a5fa' }}>post_load</span> = after paint (polling, lazy, realtime)</span>
          <span><span style={{ color: '#64748b' }}>background</span> = no active trace</span>
        </div>
      </div>

    <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#161b22' }}>
              {['Route', 'Duration', 'DB Time', 'Queries', 'APIs', 'Images', 'Dups', 'N+1', 'Alerts'].map((h) => (
                <th key={h} style={{
                  padding: '8px 12px', fontSize: 10, fontWeight: 600, color: '#64748b',
                  textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: MONO,
                  textAlign: 'left', borderBottom: '1px solid #1e293b', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {traces.filter((t) => t.completed && t.summary).map((t) => {
              const s = t.summary
              const hasAlerts = t.alerts && t.alerts.length > 0
              const hasCritical = t.alerts?.some((a) => a.level === 'critical')
              return (
                <tr
                  key={t.id}
                  onClick={() => onSelectTrace(t.id)}
                  style={{
                    cursor: 'pointer',
                    background: hasCritical ? '#f8717108' : 'transparent',
                    borderBottom: '1px solid #0d1117',
                  }}
                >
                  <td style={{ ...td, color: '#e2e8f0', maxWidth: 200 }}>{s.route}</td>
                  <td style={{ ...td, color: colorForMs(s.durationMs, 2000, 5000), fontWeight: 600 }}>{Math.round(s.durationMs)}ms</td>
                  <td style={{ ...td, color: colorForMs(s.totalDbMs, 500, 1000) }}>{Math.round(s.totalDbMs)}ms ({s.dbPct}%)</td>
                  <td style={{ ...td, color: s.queryCount > 25 ? '#f87171' : s.queryCount > 15 ? '#fbbf24' : '#94a3b8' }}>{s.queryCount}</td>
                  <td style={td}>{s.apiCount}</td>
                  <td style={td}>{s.imageCount}</td>
                  <td style={{ ...td, color: s.duplicateGroups.length > 0 ? '#fbbf24' : '#475569' }}>{s.duplicateGroups.length}</td>
                  <td style={{ ...td, color: s.nplus1.length > 0 ? '#f87171' : '#475569' }}>{s.nplus1.length}</td>
                  <td style={td}>
                    {hasAlerts && (
                      <span style={{
                        background: hasCritical ? '#f8717120' : '#fbbf2420',
                        color: hasCritical ? '#f87171' : '#fbbf24',
                        borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 700,
                      }}>
                        {t.alerts.length}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  )
}

function colorForMs(ms, warn, crit) {
  if (ms >= crit) return '#f87171'
  if (ms >= warn) return '#fbbf24'
  return '#4ade80'
}

const td = {
  padding: '6px 12px', fontSize: 11, color: '#94a3b8',
  fontFamily: "'SF Mono', 'Fira Code', monospace",
  whiteSpace: 'nowrap',
}
