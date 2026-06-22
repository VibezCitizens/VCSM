// debuggers/performance/components/WaterfallChart.jsx
// Visual waterfall timeline showing all operations for a page load.

import TimelineBar from './TimelineBar.jsx'

const containerStyle = {
  background: '#0d1117',
  border: '1px solid #1e293b',
  borderRadius: 8,
  padding: 16,
  overflowX: 'auto',
}

const headerStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: '#e2e8f0',
  marginBottom: 12,
  fontFamily: "'SF Mono', 'Fira Code', monospace",
  letterSpacing: '0.5px',
}

export default function WaterfallChart({ dbQueries, apiRequests, pageLoads, imageLoads, title = 'Request Waterfall' }) {
  // Combine all events and find the time window
  const allEvents = []

  const baseTime = findBaseTime(dbQueries, apiRequests, pageLoads, imageLoads)

  for (const q of (dbQueries ?? [])) {
    allEvents.push({
      label: q.queryName || q.table,
      startMs: q.at - baseTime,
      durationMs: q.durationMs,
      category: 'db_query',
      severity: q.severity,
      id: q.id,
    })
  }

  for (const r of (apiRequests ?? [])) {
    allEvents.push({
      label: `${r.method} ${r.url}`,
      startMs: r.at - baseTime,
      durationMs: r.durationMs,
      category: 'api_request',
      severity: r.severity,
      id: r.id,
    })
  }

  for (const img of (imageLoads ?? []).slice(0, 20)) {
    allEvents.push({
      label: img.src,
      startMs: 0,
      durationMs: img.durationMs,
      category: 'image_load',
      severity: img.durationMs > 2000 ? 'warning' : 'ok',
      id: img.id,
    })
  }

  // Sort by start time
  allEvents.sort((a, b) => a.startMs - b.startMs)

  // Calculate total window
  const totalMs = allEvents.length > 0
    ? Math.max(...allEvents.map((e) => e.startMs + e.durationMs), 100)
    : 100

  if (allEvents.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>{title}</div>
        <div style={{ color: '#475569', fontSize: 11, textAlign: 'center', padding: 20, fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
          No operations recorded yet. Navigate the app to see the waterfall.
        </div>
      </div>
    )
  }

  // Time axis markers
  const markers = generateTimeMarkers(totalMs)

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div style={headerStyle}>{title}</div>
        <div style={{ fontSize: 10, color: '#475569', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
          {allEvents.length} operations / {Math.round(totalMs)}ms total
        </div>
      </div>

      {/* Time axis */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 160, flexShrink: 0 }} />
        <div style={{ flex: 1, position: 'relative', height: 16 }}>
          {markers.map((m) => (
            <span
              key={m.ms}
              style={{
                position: 'absolute',
                left: `${(m.ms / totalMs) * 100}%`,
                fontSize: 9,
                color: '#475569',
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                transform: 'translateX(-50%)',
              }}
            >
              {m.label}
            </span>
          ))}
        </div>
        <div style={{ width: 56, flexShrink: 0 }} />
      </div>

      {/* Bars */}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {allEvents.slice(0, 60).map((e) => (
          <TimelineBar
            key={e.id}
            label={e.label}
            startMs={e.startMs}
            durationMs={e.durationMs}
            totalMs={totalMs}
            category={e.category}
            severity={e.severity}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        {[
          { color: '#a78bfa', label: 'DB Query' },
          { color: '#60a5fa', label: 'API' },
          { color: '#fbbf24', label: 'Image' },
          { color: '#f472b6', label: 'Route' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
            <span style={{ fontSize: 10, color: '#64748b', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function findBaseTime(dbQueries, apiRequests, pageLoads, imageLoads) {
  let min = Infinity
  for (const q of (dbQueries ?? [])) if (q.at < min) min = q.at
  for (const r of (apiRequests ?? [])) if (r.at < min) min = r.at
  return min === Infinity ? 0 : min
}

function generateTimeMarkers(totalMs) {
  const count = 5
  const step = totalMs / count
  const markers = []
  for (let i = 0; i <= count; i++) {
    const ms = Math.round(step * i)
    markers.push({ ms, label: ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s` })
  }
  return markers
}
