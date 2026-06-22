// debuggers/performance/components/QueryTable.jsx
// Searchable, filterable, sortable table of all captured database queries.

import { useState, useMemo } from 'react'
import { SEVERITY_COLORS } from '../constants.js'

const tableContainerStyle = {
  background: '#0d1117',
  border: '1px solid #1e293b',
  borderRadius: 8,
  overflow: 'hidden',
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid #1e293b',
}

const inputStyle = {
  background: '#161b22',
  border: '1px solid #30363d',
  borderRadius: 6,
  padding: '6px 10px',
  color: '#e2e8f0',
  fontSize: 11,
  fontFamily: "'SF Mono', 'Fira Code', monospace",
  outline: 'none',
  width: 200,
}

const selectStyle = {
  ...inputStyle,
  width: 120,
  cursor: 'pointer',
}

const thStyle = {
  padding: '8px 12px',
  fontSize: 10,
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  fontFamily: "'SF Mono', 'Fira Code', monospace",
  textAlign: 'left',
  cursor: 'pointer',
  userSelect: 'none',
  borderBottom: '1px solid #1e293b',
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '6px 12px',
  fontSize: 11,
  color: '#94a3b8',
  fontFamily: "'SF Mono', 'Fira Code', monospace",
  borderBottom: '1px solid #0d1117',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 200,
}

export default function QueryTable({ queries, title = 'Database Queries' }) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('durationMs')
  const [sortDir, setSortDir] = useState('desc')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterRoute, setFilterRoute] = useState('all')

  const routes = useMemo(() => {
    const set = new Set()
    for (const q of queries) if (q.route) set.add(q.route)
    return Array.from(set).sort()
  }, [queries])

  const filtered = useMemo(() => {
    let result = [...queries]

    if (search) {
      const s = search.toLowerCase()
      result = result.filter((q) =>
        q.queryName?.toLowerCase().includes(s) ||
        q.table?.toLowerCase().includes(s) ||
        q.method?.toLowerCase().includes(s)
      )
    }

    if (filterSeverity !== 'all') {
      result = result.filter((q) => q.severity === filterSeverity)
    }

    if (filterRoute !== 'all') {
      result = result.filter((q) => q.route === filterRoute)
    }

    result.sort((a, b) => {
      const aVal = a[sortField] ?? 0
      const bVal = b[sortField] ?? 0
      return sortDir === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1)
    })

    return result
  }, [queries, search, sortField, sortDir, filterSeverity, filterRoute])

  function handleSort(field) {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sortIndicator = (field) => sortField === field ? (sortDir === 'desc' ? ' \u2193' : ' \u2191') : ''

  return (
    <div style={tableContainerStyle}>
      <div style={headerStyle}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
          {title} ({filtered.length})
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Search queries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All severity</option>
            <option value="ok">OK</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={filterRoute}
            onChange={(e) => setFilterRoute(e.target.value)}
            style={{ ...selectStyle, width: 160 }}
          >
            <option value="all">All routes</option>
            {routes.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#161b22' }}>
              <th style={thStyle} onClick={() => handleSort('severity')}>Sev{sortIndicator('severity')}</th>
              <th style={thStyle} onClick={() => handleSort('queryName')}>Query{sortIndicator('queryName')}</th>
              <th style={thStyle} onClick={() => handleSort('table')}>Table{sortIndicator('table')}</th>
              <th style={thStyle} onClick={() => handleSort('method')}>Method{sortIndicator('method')}</th>
              <th style={thStyle} onClick={() => handleSort('durationMs')}>Duration{sortIndicator('durationMs')}</th>
              <th style={thStyle} onClick={() => handleSort('rowCount')}>Rows{sortIndicator('rowCount')}</th>
              <th style={thStyle} onClick={() => handleSort('payloadSize')}>Size{sortIndicator('payloadSize')}</th>
              <th style={thStyle} onClick={() => handleSort('route')}>Route{sortIndicator('route')}</th>
              <th style={thStyle}>Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: 24, color: '#475569' }}>
                  {queries.length === 0 ? 'No queries captured yet' : 'No queries match filters'}
                </td>
              </tr>
            )}
            {filtered.slice(0, 200).map((q) => (
              <tr key={q.id} style={{ background: q.severity === 'critical' ? '#f8717108' : q.severity === 'warning' ? '#fbbf2408' : 'transparent' }}>
                <td style={tdStyle}>
                  <span style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: SEVERITY_COLORS[q.severity] ?? SEVERITY_COLORS.ok,
                    marginRight: 4,
                  }} />
                </td>
                <td style={{ ...tdStyle, color: '#e2e8f0', maxWidth: 180 }} title={q.queryName}>
                  {q.queryName}
                  {q.duplicateOf && (
                    <span style={{ color: '#fbbf24', fontSize: 9, marginLeft: 4 }}>DUP</span>
                  )}
                </td>
                <td style={tdStyle}>{q.table}</td>
                <td style={tdStyle}>{q.method}</td>
                <td style={{ ...tdStyle, color: SEVERITY_COLORS[q.severity] ?? '#94a3b8', fontWeight: 600 }}>
                  {Math.round(q.durationMs)}ms
                </td>
                <td style={tdStyle}>{q.rowCount}</td>
                <td style={tdStyle}>{formatBytes(q.payloadSize)}</td>
                <td style={{ ...tdStyle, maxWidth: 120 }} title={q.route}>{q.route}</td>
                <td style={{ ...tdStyle, fontSize: 10, color: '#475569' }}>
                  {new Date(q.timestamp).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '-'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
