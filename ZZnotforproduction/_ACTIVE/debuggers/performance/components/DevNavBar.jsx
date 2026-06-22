// debuggers/performance/components/DevNavBar.jsx
// Internal dev-only navigation bar for the performance dashboard.
// Replaces the hidden platform bottom nav with route inspection controls.

import { useState } from 'react'

const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"

const ROUTES = [
  { path: '/feed', label: 'Feed' },
  { path: '/chat', label: 'Chat' },
  { path: '/notifications', label: 'Notis' },
  { path: '/explore', label: 'Explore' },
  { path: '/upload', label: 'Upload' },
  { path: '/settings', label: 'Settings' },
  { path: '/learning', label: 'Learning' },
]

export default function DevNavBar({ traces, onFilterRoute, activeFilter }) {
  // Count traces per route
  const routeCounts = new Map()
  for (const t of (traces || [])) {
    if (!t.completed || !t.summary) continue
    const r = t.summary.route
    routeCounts.set(r, (routeCounts.get(r) || 0) + 1)
  }

  // Get unique routes from actual traces
  const traceRoutes = [...new Set((traces || []).filter((t) => t.completed).map((t) => t.summary?.route).filter(Boolean))]

  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid #1e293b',
      borderRadius: 8,
      padding: '8px 12px',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: '#64748b', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Route Inspector
        </span>
        <span style={{ fontSize: 9, color: '#475569', fontFamily: MONO }}>
          (filter traces by route — replaces platform nav on this page)
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {/* All routes button */}
        <RouteButton
          label="All Routes"
          count={(traces || []).filter((t) => t.completed).length}
          active={!activeFilter}
          onClick={() => onFilterRoute(null)}
        />

        {/* Background activity */}
        <RouteButton
          label="Background"
          icon="bg"
          active={activeFilter === '__background'}
          onClick={() => onFilterRoute('__background')}
          color="#64748b"
        />

        {/* Separator */}
        <div style={{ width: 1, background: '#1e293b', margin: '0 4px' }} />

        {/* Routes from actual traces (dynamic) */}
        {traceRoutes.map((route) => (
          <RouteButton
            key={route}
            label={route}
            count={routeCounts.get(route) || 0}
            active={activeFilter === route}
            onClick={() => onFilterRoute(route)}
          />
        ))}

        {/* Quick-access routes (if not in traces yet) */}
        {ROUTES.filter((r) => !traceRoutes.includes(r.path)).map((r) => (
          <RouteButton
            key={r.path}
            label={r.label}
            count={0}
            active={activeFilter === r.path}
            onClick={() => onFilterRoute(r.path)}
            dimmed
          />
        ))}
      </div>
    </div>
  )
}

function RouteButton({ label, count, active, onClick, dimmed, icon, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#161b22' : 'transparent',
        border: active ? '1px solid #30363d' : '1px solid transparent',
        borderRadius: 6,
        padding: '4px 10px',
        color: active ? (color || '#e2e8f0') : dimmed ? '#30363d' : (color || '#64748b'),
        fontSize: 10,
        fontFamily: MONO,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {icon && <span style={{ fontSize: 8 }}>{icon === 'bg' ? '\u25CB' : icon}</span>}
      {label}
      {count > 0 && (
        <span style={{
          background: active ? '#4ade8020' : '#1e293b',
          color: active ? '#4ade80' : '#475569',
          borderRadius: 999,
          padding: '0 5px',
          fontSize: 9,
          lineHeight: '14px',
        }}>
          {count}
        </span>
      )}
    </button>
  )
}
