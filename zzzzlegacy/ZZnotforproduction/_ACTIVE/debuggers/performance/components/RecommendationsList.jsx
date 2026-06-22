// debuggers/performance/components/RecommendationsList.jsx
// Displays auto-generated performance recommendations with priority badges.

import { useState } from 'react'

const PRIORITY_COLORS = {
  critical: '#f87171',
  high: '#fb923c',
  medium: '#fbbf24',
  low: '#94a3b8',
}

const PRIORITY_BG = {
  critical: '#f8717115',
  high: '#fb923c12',
  medium: '#fbbf2410',
  low: '#94a3b808',
}

const CATEGORY_LABELS = {
  database: 'DB',
  api: 'API',
  page_load: 'LOAD',
  assets: 'ASSET',
}

const containerStyle = {
  background: '#0d1117',
  border: '1px solid #1e293b',
  borderRadius: 8,
  overflow: 'hidden',
}

export default function RecommendationsList({ recommendations, title = 'Performance Recommendations', onExport }) {
  const [expandedId, setExpandedId] = useState(null)
  const [filterPriority, setFilterPriority] = useState('all')

  const filtered = filterPriority === 'all'
    ? recommendations
    : recommendations.filter((r) => r.priority === filterPriority)

  const counts = {
    critical: recommendations.filter((r) => r.priority === 'critical').length,
    high: recommendations.filter((r) => r.priority === 'high').length,
    medium: recommendations.filter((r) => r.priority === 'medium').length,
    low: recommendations.filter((r) => r.priority === 'low').length,
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #1e293b',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
          {title} ({filtered.length})
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {Object.entries(counts).map(([priority, count]) => (
            <button
              key={priority}
              onClick={() => setFilterPriority(filterPriority === priority ? 'all' : priority)}
              style={{
                background: filterPriority === priority ? PRIORITY_COLORS[priority] + '30' : 'transparent',
                border: `1px solid ${PRIORITY_COLORS[priority]}44`,
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 10,
                color: PRIORITY_COLORS[priority],
                cursor: 'pointer',
                fontFamily: "'SF Mono', 'Fira Code', monospace",
              }}
            >
              {count} {priority}
            </button>
          ))}
          {onExport && recommendations.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onExport() }}
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 4,
                padding: '2px 10px',
                fontSize: 10,
                color: '#94a3b8',
                cursor: 'pointer',
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                marginLeft: 4,
              }}
            >
              {'\u2B07'} Download JSON
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: 500, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{
            padding: 24,
            textAlign: 'center',
            color: '#475569',
            fontSize: 11,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
          }}>
            {recommendations.length === 0 ? 'No issues detected. Navigate the app to collect data.' : 'No recommendations for this filter.'}
          </div>
        )}

        {filtered.map((rec) => {
          const isExpanded = expandedId === rec.id
          return (
            <div
              key={rec.id}
              style={{
                borderBottom: '1px solid #1e293b',
                background: isExpanded ? '#161b22' : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => setExpandedId(isExpanded ? null : rec.id)}
            >
              {/* Summary row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}>
                {/* Priority badge */}
                <span style={{
                  background: PRIORITY_BG[rec.priority],
                  color: PRIORITY_COLORS[rec.priority],
                  border: `1px solid ${PRIORITY_COLORS[rec.priority]}44`,
                  borderRadius: 4,
                  padding: '1px 6px',
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  textTransform: 'uppercase',
                  flexShrink: 0,
                }}>
                  {rec.priority}
                </span>

                {/* Category */}
                <span style={{
                  background: '#1e293b',
                  color: '#64748b',
                  borderRadius: 4,
                  padding: '1px 6px',
                  fontSize: 9,
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  flexShrink: 0,
                }}>
                  {CATEGORY_LABELS[rec.category] ?? rec.category}
                </span>

                {/* Title */}
                <span style={{
                  fontSize: 11,
                  color: '#e2e8f0',
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {rec.title}
                </span>

                <span style={{ color: '#475569', fontSize: 10, flexShrink: 0 }}>
                  {isExpanded ? '\u25B2' : '\u25BC'}
                </span>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ padding: '0 16px 12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6, fontFamily: "'SF Mono', 'Fira Code', monospace", marginBottom: 8 }}>
                    {rec.description}
                  </div>

                  {rec.impact && (
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: '#f87171', fontWeight: 600, fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                        IMPACT:{' '}
                      </span>
                      <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                        {rec.impact}
                      </span>
                    </div>
                  )}

                  {rec.fix && (
                    <div style={{
                      background: '#4ade8010',
                      border: '1px solid #4ade8020',
                      borderRadius: 6,
                      padding: '8px 10px',
                      fontSize: 10,
                      color: '#4ade80',
                      lineHeight: 1.5,
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                    }}>
                      FIX: {rec.fix}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
