// debuggers/performance/components/ScreenDetailView.jsx
// Detail view for a single screen trace — shows waterfall, DAL breakdown, duplicates.

import TimelineBar from './TimelineBar.jsx'
import { SEVERITY_COLORS } from '../constants.js'

const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"

export default function ScreenDetailView({ trace, onBack }) {
  if (!trace || !trace.summary) {
    return <div style={{ color: '#475569', padding: 20, fontFamily: MONO }}>No trace selected.</div>
  }

  const s = trace.summary

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 11, fontFamily: MONO, marginBottom: 4 }}>
            &larr; Back to screens
          </button>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: 0, fontFamily: MONO }}>{s.route}</h2>
          <div style={{ fontSize: 10, color: '#475569', fontFamily: MONO }}>{trace.startedAt} &middot; {Math.round(s.durationMs)}ms</div>
        </div>
      </div>

      {/* Alerts */}
      {trace.alerts && trace.alerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {trace.alerts.map((a, i) => (
            <div key={i} style={{
              background: a.level === 'critical' ? '#f8717115' : '#fbbf2412',
              border: `1px solid ${a.level === 'critical' ? '#f8717133' : '#fbbf2433'}`,
              borderRadius: 6, padding: '6px 12px', marginBottom: 4,
              fontSize: 11, color: a.level === 'critical' ? '#f87171' : '#fbbf24', fontFamily: MONO,
            }}>
              [{a.level.toUpperCase()}] {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        <StatBox label="Total" value={`${Math.round(s.durationMs)}ms`} />
        <StatBox label="DB Time" value={`${Math.round(s.totalDbMs)}ms (${s.dbPct}%)`} />
        <StatBox label="Queries" value={s.queryCount} color={s.queryCount > 25 ? '#f87171' : undefined} />
        <StatBox label="Duplicates" value={s.duplicateGroups.length} color={s.duplicateGroups.length > 0 ? '#fbbf24' : undefined} />
      </div>

      {/* Waterfall */}
      <Section title="Waterfall Timeline">
        {trace.dbQueries.length === 0 && trace.apiRequests.length === 0 ? (
          <div style={{ color: '#475569', fontSize: 11, padding: 16, fontFamily: MONO }}>No operations in this trace.</div>
        ) : (
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {buildWaterfallItems(trace).map((item, i) => (
              <TimelineBar
                key={i}
                label={item.label}
                startMs={item.startMs}
                durationMs={item.durationMs}
                totalMs={s.durationMs || 1}
                category={item.category}
                severity={item.severity}
              />
            ))}
          </div>
        )}
      </Section>

      {/* DAL breakdown */}
      <Section title="DAL Methods">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['DAL', 'Table', 'Calls', 'Total ms', 'Rows'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.byDal.map((d) => (
              <tr key={d.name}>
                <td style={{ ...tdStyle, color: '#e2e8f0' }}>{d.name} {d.calls > 1 && <span style={{ color: '#fbbf24', fontSize: 9 }}>DUP</span>}</td>
                <td style={tdStyle}>{d.table}</td>
                <td style={{ ...tdStyle, color: d.calls > 1 ? '#fbbf24' : '#94a3b8', fontWeight: 600 }}>{d.calls}</td>
                <td style={{ ...tdStyle, color: d.totalMs > 300 ? '#f87171' : '#94a3b8' }}>{Math.round(d.totalMs)}</td>
                <td style={tdStyle}>{d.totalRows}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Tables */}
      <Section title="Tables Read">
        {s.byTable.map((t) => (
          <div key={t.table} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #1e293b22' }}>
            <span style={{ color: '#94a3b8', fontSize: 11, fontFamily: MONO }}>{t.table}</span>
            <span style={{ color: t.calls > 2 ? '#fbbf24' : '#475569', fontSize: 11, fontFamily: MONO, fontWeight: 600 }}>{t.calls}x &middot; {Math.round(t.totalMs)}ms</span>
          </div>
        ))}
      </Section>
    </div>
  )
}

function buildWaterfallItems(trace) {
  const items = []
  const base = trace.startTime || 0

  for (const q of trace.dbQueries) {
    items.push({
      label: q.queryName || q.table,
      startMs: (q.at || 0) - base,
      durationMs: q.durationMs || 0,
      category: 'db_query',
      severity: q.severity,
    })
  }

  for (const r of trace.apiRequests) {
    items.push({
      label: `${r.method || 'GET'} ${r.url}`,
      startMs: (r.at || 0) - base,
      durationMs: r.durationMs || 0,
      category: 'api_request',
      severity: r.severity,
    })
  }

  for (const img of trace.imageLoads.slice(0, 15)) {
    items.push({
      label: img.src,
      startMs: 0,
      durationMs: img.durationMs || 0,
      category: 'image_load',
      severity: img.durationMs > 2000 ? 'warning' : 'ok',
    })
  }

  return items.sort((a, b) => a.startMs - b.startMs)
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 10, fontFamily: MONO }}>{title}</div>
      {children}
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: MONO }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color || '#e2e8f0', fontFamily: MONO }}>{value}</div>
    </div>
  )
}

const thStyle = { padding: '6px 10px', fontSize: 10, fontWeight: 600, color: '#64748b', textAlign: 'left', fontFamily: MONO, borderBottom: '1px solid #1e293b' }
const tdStyle = { padding: '5px 10px', fontSize: 11, color: '#94a3b8', fontFamily: MONO, borderBottom: '1px solid #0d1117' }
