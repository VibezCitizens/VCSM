// debuggers/performance/components/TimelineBar.jsx
// Single horizontal bar in the waterfall chart. Shows timing relative to a total duration.

import { SEVERITY_COLORS } from '../constants.js'

const CATEGORY_COLORS = {
  db_query: '#a78bfa',
  api_request: '#60a5fa',
  page_load: '#4ade80',
  image_load: '#fbbf24',
  route_change: '#f472b6',
  render: '#34d399',
  hydration: '#c084fc',
}

export default function TimelineBar({ label, startMs, durationMs, totalMs, category, severity }) {
  const maxWidth = totalMs > 0 ? totalMs : 1
  const leftPct = Math.min((startMs / maxWidth) * 100, 100)
  const widthPct = Math.max(Math.min((durationMs / maxWidth) * 100, 100 - leftPct), 0.5)
  const color = severity && severity !== 'ok'
    ? SEVERITY_COLORS[severity]
    : CATEGORY_COLORS[category] ?? '#60a5fa'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, minHeight: 20 }}>
      <div style={{
        width: 160,
        fontSize: 10,
        color: '#94a3b8',
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        {label}
      </div>

      <div style={{ flex: 1, position: 'relative', height: 14, background: '#1e293b33', borderRadius: 2 }}>
        <div
          style={{
            position: 'absolute',
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            height: '100%',
            background: color,
            borderRadius: 2,
            opacity: 0.85,
            minWidth: 2,
          }}
          title={`${label}: ${Math.round(durationMs)}ms (start: ${Math.round(startMs)}ms)`}
        />
      </div>

      <div style={{
        width: 56,
        fontSize: 10,
        color: color,
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        textAlign: 'right',
        flexShrink: 0,
      }}>
        {Math.round(durationMs)}ms
      </div>
    </div>
  )
}
