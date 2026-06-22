// debuggers/performance/components/AlertBanner.jsx
// Shows threshold alert banners at top of dashboard.

const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"

export default function AlertBanner({ traces }) {
  if (!traces || traces.length === 0) return null

  // Collect all alerts from recent traces
  const allAlerts = []
  for (const t of traces.slice(0, 5)) {
    if (t.alerts && t.alerts.length > 0) {
      for (const a of t.alerts) {
        allAlerts.push({ ...a, route: t.summary?.route })
      }
    }
  }

  if (allAlerts.length === 0) return null

  const criticals = allAlerts.filter((a) => a.level === 'critical')
  const warnings = allAlerts.filter((a) => a.level === 'warning')

  return (
    <div style={{ marginBottom: 16 }}>
      {criticals.length > 0 && (
        <div style={{
          background: '#f8717112',
          border: '1px solid #f8717133',
          borderRadius: 8,
          padding: '10px 16px',
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', fontFamily: MONO, marginBottom: 4 }}>
            {criticals.length} CRITICAL ALERT{criticals.length > 1 ? 'S' : ''}
          </div>
          {criticals.slice(0, 5).map((a, i) => (
            <div key={i} style={{ fontSize: 10, color: '#f87171', fontFamily: MONO, padding: '2px 0' }}>
              {a.message}
            </div>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div style={{
          background: '#fbbf2410',
          border: '1px solid #fbbf2433',
          borderRadius: 8,
          padding: '10px 16px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', fontFamily: MONO, marginBottom: 4 }}>
            {warnings.length} WARNING{warnings.length > 1 ? 'S' : ''}
          </div>
          {warnings.slice(0, 5).map((a, i) => (
            <div key={i} style={{ fontSize: 10, color: '#fbbf24', fontFamily: MONO, padding: '2px 0' }}>
              {a.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
