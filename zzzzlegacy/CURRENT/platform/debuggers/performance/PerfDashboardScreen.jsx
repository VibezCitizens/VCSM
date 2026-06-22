// debuggers/performance/PerfDashboardScreen.jsx
// Full-page performance dashboard at /dev/performance.
// DEV-ONLY. Multi-view tabbed dashboard with screen traces, alerts, and analysis.

import { useMemo, useState, useSyncExternalStore } from 'react'
import { getPerfState, subscribePerfStore, clearPerfStore, toggleRecording, isRecording } from './store.js'
import { getScreenTraces, subscribeScreenTraces, clearScreenTraces, getBackgroundActivity } from './screenTrace.js'
import { generateRecommendations } from './analysis/recommendations.js'
import { detectDuplicateQueries, detectNPlus1, analyzeRequestGroups } from './analysis/overfetch.js'
import { matchKnownIssues } from './analysis/knownIssues.js'
import { downloadSnapshot, copySnapshot, exportRecommendations } from './logger.js'

import MetricCard from './components/MetricCard.jsx'
import QueryTable from './components/QueryTable.jsx'
import WaterfallChart from './components/WaterfallChart.jsx'
import RecommendationsList from './components/RecommendationsList.jsx'
import DashboardTabs from './components/DashboardTabs.jsx'
import ScreenListView from './components/ScreenListView.jsx'
import ScreenDetailView from './components/ScreenDetailView.jsx'
import GroupView from './components/GroupView.jsx'
import AlertBanner from './components/AlertBanner.jsx'
import DevNavBar from './components/DevNavBar.jsx'
import KnownIssuesPanel from './components/KnownIssuesPanel.jsx'

const MONO = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"

export default function PerfDashboardScreen() {
  if (!import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_DIAGNOSTICS !== '1') {
    return <div style={{ color: '#f87171', padding: 40, fontFamily: MONO }}>Performance dashboard is only available in dev mode.</div>
  }

  const state = useSyncExternalStore(subscribePerfStore, getPerfState)
  const traces = useSyncExternalStore(subscribeScreenTraces, getScreenTraces)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTraceId, setSelectedTraceId] = useState(null)
  const [routeFilter, setRouteFilter] = useState(null)

  const background = useMemo(() => getBackgroundActivity(), [state])

  // Filter traces by selected route
  const filteredTraces = useMemo(() => {
    if (!traces) return []
    if (!routeFilter) return traces
    if (routeFilter === '__background') return [] // background has no traces
    return traces.filter((t) => t.summary?.route === routeFilter)
  }, [traces, routeFilter])

  const analysis = useMemo(() => {
    // When route filter is active, analyze only queries from that route's traces
    let sourceQueries = state.dbQueries
    let sourceApi = state.apiRequests
    let analysisLabel = 'Session'

    if (routeFilter === '__background') {
      sourceQueries = background.dbQueries
      sourceApi = background.apiRequests
      analysisLabel = 'Background'
    } else if (routeFilter) {
      // Gather queries from filtered traces only
      sourceQueries = filteredTraces.flatMap((t) => t.dbQueries || [])
      sourceApi = filteredTraces.flatMap((t) => t.apiRequests || [])
      analysisLabel = routeFilter
    }

    const recommendations = generateRecommendations({ ...state, dbQueries: sourceQueries, apiRequests: sourceApi, pageLoads: state.pageLoads, imageLoads: state.imageLoads })
    const duplicates = detectDuplicateQueries(sourceQueries)
    const nplus1 = detectNPlus1(sourceQueries)
    const knownIssues = matchKnownIssues(duplicates, routeFilter)

    const totalDbMs = sourceQueries.reduce((s, q) => s + (q.durationMs || 0), 0)
    const totalApiMs = sourceApi.reduce((s, r) => s + (r.durationMs || 0), 0)
    const avgDbMs = sourceQueries.length > 0 ? totalDbMs / sourceQueries.length : 0
    const slowQueries = sourceQueries.filter((q) => q.severity !== 'ok')
    const totalRows = sourceQueries.reduce((s, q) => s + (q.rowCount || 0), 0)
    const totalPayload = sourceQueries.reduce((s, q) => s + (q.payloadSize || 0), 0)

    // Aggregate by DAL
    const byDal = new Map()
    for (const q of sourceQueries) {
      const name = q.queryName || q.table
      if (!byDal.has(name)) byDal.set(name, { name, table: q.table, count: 0, totalMs: 0, totalRows: 0 })
      const g = byDal.get(name)
      g.count++
      g.totalMs += q.durationMs
      g.totalRows += q.rowCount
    }

    // Aggregate by table
    const byTable = new Map()
    for (const q of sourceQueries) {
      const t = q.table || 'unknown'
      if (!byTable.has(t)) byTable.set(t, { table: t, count: 0, totalMs: 0 })
      const g = byTable.get(t)
      g.count++
      g.totalMs += q.durationMs
    }

    return {
      recommendations,
      duplicates,
      nplus1,
      knownIssues,
      totalDbMs,
      totalApiMs,
      avgDbMs,
      slowQueries,
      totalRows,
      totalPayload,
      byDal: Array.from(byDal.values()).sort((a, b) => b.count - a.count),
      byTable: Array.from(byTable.values()).sort((a, b) => b.count - a.count),
      analysisLabel,
      queryCount: sourceQueries.length,
      apiCount: sourceApi.length,
    }
  }, [state, routeFilter, filteredTraces, background])

  function handleClearAll() {
    clearPerfStore()
    clearScreenTraces()
  }

  const selectedTrace = selectedTraceId ? (traces || []).find((t) => t.id === selectedTraceId) : null

  return (
    <div style={{
      minHeight: '100vh',
      background: '#010409',
      color: '#e2e8f0',
      fontFamily: MONO,
      padding: '20px 24px',
      paddingBottom: 80,
    }}>
      {/* Page header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#e2e8f0', letterSpacing: 0.5 }}>
            Performance Dashboard
          </h1>
          <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0' }}>
            VCSM Internal Observability &mdash; {(traces || []).filter((t) => t.completed).length} screen traces captured
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <DashButton onClick={toggleRecording} active={isRecording()}>
            {isRecording() ? '\u23F8 Pause' : '\u25B6 Record'}
          </DashButton>
          <DashButton onClick={handleClearAll}>Clear All</DashButton>
          <DashButton onClick={downloadSnapshot}>Export JSON</DashButton>
          <DashButton onClick={copySnapshot}>Copy</DashButton>
        </div>
      </div>

      {/* Dev-only route inspector (replaces hidden bottom nav) */}
      <DevNavBar
        traces={traces || []}
        onFilterRoute={(route) => { setRouteFilter(route); setSelectedTraceId(null) }}
        activeFilter={routeFilter}
      />

      {/* Scope indicator */}
      {routeFilter && (
        <div style={{
          background: routeFilter === '__background' ? '#64748b15' : '#4ade8015',
          border: `1px solid ${routeFilter === '__background' ? '#64748b33' : '#4ade8033'}`,
          borderRadius: 8,
          padding: '8px 16px',
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, color: routeFilter === '__background' ? '#64748b' : '#4ade80', fontFamily: MONO }}>
            Showing: {routeFilter === '__background' ? 'Background activity (polling, realtime)' : `Route: ${routeFilter}`}
            {' '}&mdash; {analysis.queryCount} queries, {analysis.apiCount} API calls
          </span>
          <button
            onClick={() => setRouteFilter(null)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 10, fontFamily: MONO }}
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Alerts */}
      <AlertBanner traces={filteredTraces || []} />

      {/* Tabs */}
      <DashboardTabs
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setSelectedTraceId(null) }}
        alertCount={analysis.duplicates.length}
        knownIssueCount={analysis.knownIssues.length}
      />

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab state={state} analysis={analysis} traces={filteredTraces} background={background} routeFilter={routeFilter}
          onExportRecommendations={() => exportRecommendations({
            recommendations: analysis.recommendations,
            duplicates: analysis.duplicates,
            nplus1: analysis.nplus1,
            routeFilter,
            analysisLabel: analysis.analysisLabel,
          })}
        />
      )}

      {activeTab === 'screens' && !selectedTrace && (
        <ScreenListView
          traces={filteredTraces}
          onSelectTrace={(id) => setSelectedTraceId(id)}
        />
      )}

      {activeTab === 'screens' && selectedTrace && (
        <ScreenDetailView
          trace={selectedTrace}
          onBack={() => setSelectedTraceId(null)}
        />
      )}

      {activeTab === 'dal' && (
        <GroupView
          title="DAL Methods"
          items={analysis.byDal.map((d) => ({
            name: d.name,
            detail: d.table,
            count: d.count,
            totalMs: d.totalMs,
            extra: `${d.totalRows} rows`,
          }))}
          emptyMessage="No DAL calls captured yet."
        />
      )}

      {activeTab === 'tables' && (
        <GroupView
          title="Database Tables"
          items={analysis.byTable.map((t) => ({
            name: t.table,
            count: t.count,
            totalMs: t.totalMs,
          }))}
          countLabel="reads"
          emptyMessage="No table reads captured yet."
        />
      )}

      {activeTab === 'duplicates' && (
        <GroupView
          title="Duplicate Query Groups"
          items={analysis.duplicates.map((d) => ({
            name: d.queryName,
            detail: `${d.table} \u00B7 ${d.method}`,
            count: d.count,
            totalMs: d.totalDurationMs,
          }))}
          countLabel="duplicates"
          emptyMessage="No duplicate queries detected."
        />
      )}

      {activeTab === 'nplus1' && (
        <GroupView
          title="N+1 Query Patterns"
          items={analysis.nplus1.map((n) => ({
            name: n.table,
            detail: n.suggestion,
            count: n.queryCount,
            totalMs: n.totalDurationMs,
            extra: `avg ${Math.round(n.avgDurationMs)}ms`,
          }))}
          countLabel="in burst"
          emptyMessage="No N+1 patterns detected."
        />
      )}

      {activeTab === 'known-issues' && (
        <KnownIssuesPanel matches={analysis.knownIssues} />
      )}

      {activeTab === 'queries' && (
        <QueryTable queries={state.dbQueries} />
      )}
    </div>
  )
}

function OverviewTab({ state, analysis, traces, background, routeFilter, onExportRecommendations }) {
  const scopeLabel = analysis.analysisLabel || 'Session'
  return (
    <>
      {/* Scope banner */}
      <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 700, color: '#e2e8f0', fontFamily: MONO }}>
        {scopeLabel === 'Session' ? 'Session Totals' : scopeLabel === 'Background' ? 'Background Activity' : `Route: ${scopeLabel}`}
        {scopeLabel === 'Session' && background.dbQueries.length > 0 && (
          <span style={{ color: '#64748b', fontWeight: 400, marginLeft: 8, fontSize: 10 }}>
            (includes {background.dbQueries.length} background queries — use route filter to isolate)
          </span>
        )}
      </div>

      {/* Summary metrics */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <MetricCard label={`DB Queries (${scopeLabel})`} value={analysis.queryCount} sub={`${Math.round(analysis.totalDbMs)}ms total`} severity={analysis.queryCount > 50 ? 'warning' : 'ok'} />
        <MetricCard label="Avg Query" value={`${Math.round(analysis.avgDbMs)}ms`} sub={`${analysis.slowQueries.length} slow`} severity={analysis.avgDbMs > 300 ? 'critical' : analysis.avgDbMs > 100 ? 'warning' : 'ok'} />
        <MetricCard label={`API (${scopeLabel})`} value={analysis.apiCount} sub={`${Math.round(analysis.totalApiMs)}ms total`} />
        <MetricCard label="Screen Traces" value={traces.filter((t) => t.completed).length} sub="route loads captured" />
        <MetricCard label="Duplicates" value={analysis.duplicates.length} severity={analysis.duplicates.length > 0 ? 'warning' : 'ok'} />
        <MetricCard label="N+1 Issues" value={analysis.nplus1.length} severity={analysis.nplus1.length > 0 ? 'critical' : 'ok'} />
        <MetricCard label="Data Fetched" value={formatBytes(analysis.totalPayload)} sub={`${analysis.totalRows} rows`} />
        <MetricCard label="Recommendations" value={analysis.recommendations.length} severity={analysis.recommendations.some((r) => r.priority === 'critical') ? 'critical' : analysis.recommendations.length > 0 ? 'warning' : 'ok'} />
      </div>

      {/* Waterfall */}
      <div style={{ marginBottom: 24 }}>
        <WaterfallChart
          dbQueries={state.dbQueries.slice(0, 60)}
          apiRequests={state.apiRequests.slice(0, 30)}
          pageLoads={state.pageLoads}
          imageLoads={state.imageLoads.slice(0, 20)}
        />
      </div>

      {/* Recommendations */}
      <div style={{ marginBottom: 24 }}>
        <RecommendationsList recommendations={analysis.recommendations} onExport={onExportRecommendations} />
      </div>
    </>
  )
}

function DashButton({ children, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#4ade8020' : '#161b22',
        border: `1px solid ${active ? '#4ade8044' : '#30363d'}`,
        borderRadius: 6,
        padding: '6px 14px',
        color: active ? '#4ade80' : '#94a3b8',
        fontSize: 11,
        fontFamily: MONO,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0B'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
