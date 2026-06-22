// debuggers/performance/components/GroupView.jsx
// Reusable grouped view for By DAL, By Table, Duplicates, and N+1 tabs.

const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"

/**
 * @param {{ items: Array<{ name: string, detail?: string, count: number, totalMs: number, extra?: string }>, title: string, emptyMessage: string, countLabel?: string }} props
 */
export default function GroupView({ items, title, emptyMessage, countLabel = 'calls' }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, padding: 40, textAlign: 'center' }}>
        <div style={{ color: '#475569', fontSize: 11, fontFamily: MONO }}>{emptyMessage}</div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', fontSize: 12, fontWeight: 700, color: '#e2e8f0', fontFamily: MONO }}>
        {title} ({items.length})
      </div>
      <div style={{ maxHeight: 500, overflowY: 'auto' }}>
        {items.map((item, i) => (
          <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#e2e8f0', fontSize: 11, fontFamily: MONO }}>{item.name}</div>
              {item.detail && <div style={{ color: '#475569', fontSize: 10, fontFamily: MONO, marginTop: 2 }}>{item.detail}</div>}
            </div>
            <div style={{ display: 'flex', gap: 12, flexShrink: 0, alignItems: 'center' }}>
              <span style={{
                background: item.count > 3 ? '#f8717120' : item.count > 1 ? '#fbbf2420' : '#4ade8020',
                color: item.count > 3 ? '#f87171' : item.count > 1 ? '#fbbf24' : '#4ade80',
                borderRadius: 4, padding: '1px 8px', fontSize: 10, fontWeight: 700, fontFamily: MONO,
              }}>
                {item.count} {countLabel}
              </span>
              <span style={{ color: item.totalMs > 300 ? '#f87171' : '#94a3b8', fontSize: 10, fontFamily: MONO, width: 60, textAlign: 'right' }}>
                {Math.round(item.totalMs)}ms
              </span>
              {item.extra && (
                <span style={{ color: '#475569', fontSize: 10, fontFamily: MONO }}>{item.extra}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
