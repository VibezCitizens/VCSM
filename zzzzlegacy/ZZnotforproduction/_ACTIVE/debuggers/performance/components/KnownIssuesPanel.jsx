// debuggers/performance/components/KnownIssuesPanel.jsx
// Displays matched known issues from the Logan performance knowledge base.
// DEV-ONLY. Shows issue name, status badge, description, and recommended action.

const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"

const STATUS_STYLES = {
  open: { background: '#f8717120', color: '#f87171', label: 'OPEN' },
  partial: { background: '#fbbf2420', color: '#fbbf24', label: 'PARTIAL' },
  fixed: { background: '#4ade8020', color: '#4ade80', label: 'FIXED' },
}

const CATEGORY_LABELS = {
  'duplicate-query': 'Duplicate Query',
  'high-volume': 'High Volume',
  'background-noise': 'Background Noise',
  'waterfall': 'Waterfall',
  'parallel-load': 'Parallel Load',
}

/**
 * @param {{ matches: Array<{ ruleId, name, category, description, status, action, affectedRoutes, matchedGroup }> }} props
 */
export default function KnownIssuesPanel({ matches }) {
  if (!matches || matches.length === 0) {
    return (
      <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, padding: 40, textAlign: 'center' }}>
        <div style={{ color: '#4ade80', fontSize: 12, fontFamily: MONO, marginBottom: 4 }}>No known issues matched</div>
        <div style={{ color: '#475569', fontSize: 10, fontFamily: MONO }}>
          Duplicate query groups did not match any documented VCSM bottleneck patterns.
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', fontFamily: MONO }}>
          Known Issue Matches ({matches.length})
        </span>
        <span style={{ fontSize: 9, color: '#475569', fontFamily: MONO }}>
          Source: logan/performance/known-bottlenecks.md
        </span>
      </div>

      <div style={{ maxHeight: 600, overflowY: 'auto' }}>
        {matches.map((match) => {
          const statusStyle = STATUS_STYLES[match.status] || STATUS_STYLES.open
          const categoryLabel = CATEGORY_LABELS[match.category] || match.category

          return (
            <div key={match.ruleId} style={{
              padding: '14px 16px',
              borderBottom: '1px solid #1e293b',
            }}>
              {/* Header row: name + status badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600, fontFamily: MONO }}>
                    {match.name}
                  </span>
                  <span style={{
                    background: statusStyle.background,
                    color: statusStyle.color,
                    borderRadius: 4,
                    padding: '1px 6px',
                    fontSize: 9,
                    fontWeight: 700,
                    fontFamily: MONO,
                  }}>
                    {statusStyle.label}
                  </span>
                  <span style={{
                    background: '#64748b15',
                    color: '#64748b',
                    borderRadius: 4,
                    padding: '1px 6px',
                    fontSize: 9,
                    fontFamily: MONO,
                  }}>
                    {categoryLabel}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div style={{ color: '#94a3b8', fontSize: 10, fontFamily: MONO, lineHeight: 1.5, marginBottom: 8 }}>
                {match.description}
              </div>

              {/* Matched group detail */}
              {match.matchedGroup && (
                <div style={{
                  background: '#161b22',
                  borderRadius: 6,
                  padding: '8px 12px',
                  marginBottom: 8,
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                }}>
                  <span style={{ color: '#64748b', fontSize: 9, fontFamily: MONO }}>Matched:</span>
                  <span style={{ color: '#e2e8f0', fontSize: 10, fontFamily: MONO }}>{match.matchedGroup.table}</span>
                  {match.matchedGroup.queryName && (
                    <span style={{ color: '#475569', fontSize: 10, fontFamily: MONO }}>{match.matchedGroup.queryName}</span>
                  )}
                  <span style={{
                    color: match.matchedGroup.count > 3 ? '#f87171' : '#fbbf24',
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: MONO,
                  }}>
                    {match.matchedGroup.count}x
                  </span>
                  <span style={{ color: '#64748b', fontSize: 10, fontFamily: MONO }}>
                    {Math.round(match.matchedGroup.totalDurationMs)}ms
                  </span>
                </div>
              )}

              {/* Recommended action */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
              }}>
                <span style={{ color: '#475569', fontSize: 9, fontFamily: MONO, flexShrink: 0, marginTop: 1 }}>Action:</span>
                <span style={{ color: match.status === 'fixed' ? '#4ade80' : '#fbbf24', fontSize: 10, fontFamily: MONO, lineHeight: 1.4 }}>
                  {match.action}
                </span>
              </div>

              {/* Affected routes */}
              {match.affectedRoutes && match.affectedRoutes.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {match.affectedRoutes.map((route) => (
                    <span key={route} style={{
                      background: '#0d1117',
                      border: '1px solid #1e293b',
                      borderRadius: 4,
                      padding: '1px 6px',
                      fontSize: 9,
                      color: '#475569',
                      fontFamily: MONO,
                    }}>
                      {route}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
