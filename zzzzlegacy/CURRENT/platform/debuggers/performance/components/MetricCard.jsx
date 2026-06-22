// debuggers/performance/components/MetricCard.jsx
// Compact stat card for the performance dashboard and overlay.

import { SEVERITY_COLORS } from '../constants.js'

const cardStyle = {
  background: '#0d1117',
  border: '1px solid #1e293b',
  borderRadius: 8,
  padding: '12px 16px',
  minWidth: 140,
  flex: '1 1 140px',
}

const labelStyle = {
  fontSize: 11,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 4,
  fontFamily: "'SF Mono', 'Fira Code', monospace",
}

const valueStyle = {
  fontSize: 22,
  fontWeight: 700,
  fontFamily: "'SF Mono', 'Fira Code', monospace",
  lineHeight: 1.2,
}

const subStyle = {
  fontSize: 10,
  color: '#475569',
  marginTop: 2,
  fontFamily: "'SF Mono', 'Fira Code', monospace",
}

export default function MetricCard({ label, value, sub, severity = 'ok', onClick }) {
  const color = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.ok

  return (
    <div
      style={{ ...cardStyle, borderColor: severity !== 'ok' ? color + '44' : '#1e293b', cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div style={labelStyle}>{label}</div>
      <div style={{ ...valueStyle, color }}>{value}</div>
      {sub && <div style={subStyle}>{sub}</div>}
    </div>
  )
}
