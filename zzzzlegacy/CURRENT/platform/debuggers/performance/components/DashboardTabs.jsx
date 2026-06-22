// debuggers/performance/components/DashboardTabs.jsx
// Tab navigation for the multi-view performance dashboard.

const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'screens', label: 'By Screen' },
  { id: 'dal', label: 'By DAL' },
  { id: 'tables', label: 'By Table' },
  { id: 'duplicates', label: 'Duplicates' },
  { id: 'nplus1', label: 'N+1' },
  { id: 'known-issues', label: 'Known Issues' },
  { id: 'queries', label: 'All Queries' },
]

export { TABS }

export default function DashboardTabs({ activeTab, onTabChange, alertCount = 0, knownIssueCount = 0 }) {
  return (
    <div style={{
      display: 'flex',
      gap: 2,
      background: '#0d1117',
      border: '1px solid #1e293b',
      borderRadius: 8,
      padding: 3,
      marginBottom: 16,
      overflowX: 'auto',
    }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              background: isActive ? '#161b22' : 'transparent',
              border: isActive ? '1px solid #30363d' : '1px solid transparent',
              borderRadius: 6,
              padding: '6px 14px',
              color: isActive ? '#e2e8f0' : '#64748b',
              fontSize: 11,
              fontFamily: MONO,
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              position: 'relative',
            }}
          >
            {tab.label}
            {tab.id === 'known-issues' && knownIssueCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: '#fbbf24',
                color: '#000',
                borderRadius: 999,
                padding: '0 5px',
                fontSize: 9,
                fontWeight: 700,
                lineHeight: '16px',
              }}>
                {knownIssueCount}
              </span>
            )}
            {tab.id === 'duplicates' && alertCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: '#f87171',
                color: '#fff',
                borderRadius: 999,
                padding: '0 5px',
                fontSize: 9,
                fontWeight: 700,
                lineHeight: '16px',
              }}>
                {alertCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
