import { useMemo, useState } from 'react'
import ArchitectureGraph from './components/ArchitectureGraph'
import InspectorPanel from './components/InspectorPanel'
import { commandNodeTypeConfig, commandEdgeTypeConfig } from './data/commandGraph'
import { nodeTypeConfig as feedNodeTypeConfig, edgeTypeConfig as feedEdgeTypeConfig } from './data/graph'
import { graphMetadata } from './lib/loadGraph'
import { BOTTOM_NAV_GRAPHS, getGraphById } from './lib/loadAllGraphs'
import { ARCHITECT_GRAPHS, getArchitectGraphById } from './lib/loadArchitectGraphs'
import { NATIVE_GRAPHS, getNativeGraphById } from './lib/loadNativeGraphs'
import { DAL_GRAPH, DAL_FEATURES, filterDALGraph } from './lib/loadDALGraph'
import { sourceGraph } from './lib/loadSourceGraph'

const LEGACY_GRAPHS = {
  commands: {
    label: 'COMMANDS',
    subtitle: 'Command Ecosystem — VCSM Governance Graph',
    nodeConfig: commandNodeTypeConfig,
    edgeConfig: commandEdgeTypeConfig,
    badge: 'V1',
  },
}

const CONFIDENCE_COLORS = {
  STATICALLY_TRACED: '#10b981',
  INFERRED: '#f59e0b',
  NEEDS_LOKI_VERIFICATION: '#06b6d4',
}

export default function App() {
  const [mode, setMode] = useState('commands')
  const [bottomNavId, setBottomNavId] = useState('combined-bottom-nav')
  const [architectId, setArchitectId] = useState('auth-login')
  const [nativeId, setNativeId] = useState('native-bottom-navigation')
  const [nativeFeature, setNativeFeature] = useState('Profile')
  const [dalFeature, setDalFeature] = useState(DAL_FEATURES[0] || 'all')
  const [selectedNode, setSelectedNode] = useState(null)

  const isBottomNav = mode === 'bottom-nav'
  const isArchitect = mode === 'architect'
  const isNative    = mode === 'native'
  const isSource    = mode === 'source'
  const isDALMap    = mode === 'dal-map'

  const activeBottomNavGraph = isBottomNav ? getGraphById(bottomNavId) : null
  const activeArchitectGraph = isArchitect ? getArchitectGraphById(architectId) : null
  const activeNativeGraph    = isNative    ? getNativeGraphById(nativeId) : null
  const nativeFeatures = useMemo(
    () => buildNativeFeatureOptions(activeNativeGraph),
    [activeNativeGraph]
  )
  const organizedNativeGraph = useMemo(
    () => activeNativeGraph ? buildNativeOrganizationGraph(activeNativeGraph, nativeFeature) : null,
    [activeNativeGraph, nativeFeature]
  )
  const legacyGraph = LEGACY_GRAPHS[mode]
  const dalFiltered = isDALMap ? filterDALGraph(dalFeature) : null

  const activeMeta =
    activeBottomNavGraph?.metadata ||
    activeArchitectGraph?.metadata ||
    activeNativeGraph?.metadata ||
    (isDALMap ? DAL_GRAPH.metadata : null) ||
    (isSource ? sourceGraph.metadata : null)

  const subtitle = isBottomNav
    ? (activeMeta?.title || 'Bottom Navigation')
    : isArchitect
    ? (activeMeta?.name || 'Architect Feature Graph')
    : isNative
    ? `${nativeFeature === 'all' ? 'Full native app' : nativeFeature} · ${organizedNativeGraph?.nodes?.length ?? 0} nodes · ${organizedNativeGraph?.edges?.length ?? 0} edges`
    : isDALMap
    ? `${dalFiltered?.nodes?.length ?? '?'} nodes · ${dalFiltered?.edges?.length ?? '?'} edges · ${activeMeta?.stats?.tables ?? '?'} tables · ${activeMeta?.stats?.rpcs ?? '?'} RPCs`
    : isSource
    ? `${activeMeta?.stats?.nodes ?? '?'} nodes · ${activeMeta?.stats?.edges ?? '?'} edges · ${activeMeta?.stats?.supabaseTables ?? '?'} tables`
    : legacyGraph?.subtitle || ''

  const badge = isBottomNav
    ? 'STATIC GRAPH'
    : isArchitect
    ? 'ARCHITECT'
    : isNative
    ? 'NATIVE'
    : isDALMap
    ? 'DAL MAP'
    : isSource
    ? 'CODEGEN'
    : (legacyGraph?.badge || 'V1')

  const handleModeSwitch = (m) => {
    setMode(m)
    setSelectedNode(null)
  }

  const handleBottomNavSwitch = (id) => {
    setBottomNavId(id)
    setSelectedNode(null)
  }

  const handleArchitectSwitch = (id) => {
    setArchitectId(id)
    setSelectedNode(null)
  }

  const handleNativeSwitch = (id) => {
    setNativeId(id)
    setSelectedNode(null)
  }

  const handleNativeFeatureSwitch = (feature) => {
    setNativeFeature(feature)
    setSelectedNode(null)
  }

  const nodeConfig = (isBottomNav || isArchitect || isNative || isSource || isDALMap)
    ? feedNodeTypeConfig
    : (legacyGraph?.nodeConfig || feedNodeTypeConfig)

  const edgeConfig = (isBottomNav || isArchitect || isNative || isSource || isDALMap)
    ? feedEdgeTypeConfig
    : (legacyGraph?.edgeConfig || feedEdgeTypeConfig)

  const activeGraphKey = isBottomNav ? bottomNavId : isArchitect ? architectId : isNative ? `${nativeId}-${nativeFeature}` : isDALMap ? `dal-map-${dalFeature}` : mode

  const propNodes = isBottomNav
    ? activeBottomNavGraph?.nodes
    : isArchitect
    ? activeArchitectGraph?.nodes
    : isNative
    ? organizedNativeGraph?.nodes
    : isDALMap
    ? dalFiltered.nodes
    : isSource
    ? sourceGraph.nodes
    : undefined

  const propEdges = isBottomNav
    ? activeBottomNavGraph?.edges
    : isArchitect
    ? activeArchitectGraph?.edges
    : isNative
    ? organizedNativeGraph?.edges
    : isDALMap
    ? dalFiltered.edges
    : isSource
    ? sourceGraph.edges
    : undefined

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        background: '#09090b',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <header
        style={{
          height: 44,
          flexShrink: 0,
          background: '#0d1117',
          borderBottom: (isBottomNav || isArchitect || isNative || isSource || isDALMap) ? '1px solid #0f172a' : '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 16,
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.1em' }}>SHIELD</span>
          <span style={{ fontSize: 11, fontWeight: 400, color: '#334155', letterSpacing: '0.1em' }}>VISUALIZER</span>
          <span style={{ fontSize: 9, color: '#1e3a5f', background: '#0c1a2e', border: '1px solid #1e3a5f', borderRadius: 3, padding: '1px 5px', letterSpacing: '0.06em' }}>
            {badge}
          </span>
        </div>

        <Divider />

        {/* Mode tabs */}
        {Object.entries(LEGACY_GRAPHS).map(([key, g]) => (
          <ModeTab key={key} label={g.label} active={mode === key} onClick={() => handleModeSwitch(key)} />
        ))}
        <ModeTab label="BOTTOM NAV" active={isBottomNav} onClick={() => handleModeSwitch('bottom-nav')} accent="#6366f1" />
        <ModeTab label="ARCHITECT" active={isArchitect} onClick={() => handleModeSwitch('architect')} accent="#10b981" />
        <ModeTab label="NATIVE" active={isNative} onClick={() => handleModeSwitch('native')} accent="#f97316" />
        <ModeTab label="DAL MAP" active={isDALMap} onClick={() => handleModeSwitch('dal-map')} accent="#34d399" />
        <ModeTab label="SOURCE" active={isSource} onClick={() => handleModeSwitch('source')} accent="#a855f7" />

        <Divider />

        <span style={{ fontSize: 10, color: '#334155', flexShrink: 0, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {subtitle}
        </span>

        {(isBottomNav || isArchitect || isNative || isSource || isDALMap) && activeMeta?.confidence && (
          <span style={{
            fontSize: 8,
            color: CONFIDENCE_COLORS[activeMeta.confidence] || '#475569',
            background: '#0f172a',
            border: `1px solid ${CONFIDENCE_COLORS[activeMeta.confidence] || '#1e293b'}`,
            borderRadius: 3,
            padding: '1px 6px',
            letterSpacing: '0.06em',
            flexShrink: 0,
          }}>
            {activeMeta.confidence}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Node type legend — compact */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, overflow: 'hidden' }}>
          {Object.entries(nodeConfig).slice(0, 8).map(([type, config]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 6, height: 6, borderRadius: 2, background: config.color, flexShrink: 0 }} />
              <span style={{ fontSize: 8, color: '#374151', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{config.label}</span>
            </div>
          ))}
        </div>

        <Divider />

        {/* Edge type legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {Object.entries(edgeConfig).map(([type, config]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <svg width="12" height="6" style={{ flexShrink: 0, display: 'block' }}>
                <line x1="0" y1="3" x2="12" y2="3" stroke={config.stroke} strokeWidth="1.5" strokeDasharray={config.dashed ? '3 2' : undefined} />
              </svg>
              <span style={{ fontSize: 8, color: '#374151', whiteSpace: 'nowrap' }}>{type.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Bottom Nav sub-selector */}
      {isBottomNav && (
        <div style={{
          height: 32,
          flexShrink: 0,
          background: '#0a0f1a',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 4,
          overflowX: 'auto',
        }}>
          {BOTTOM_NAV_GRAPHS.map((g) => (
            <button
              key={g.id}
              onClick={() => handleBottomNavSwitch(g.id)}
              style={{
                background: bottomNavId === g.id ? '#1e293b' : 'transparent',
                border: bottomNavId === g.id ? '1px solid #334155' : '1px solid transparent',
                borderRadius: 4,
                padding: '2px 9px',
                cursor: 'pointer',
                fontSize: 9,
                fontWeight: bottomNavId === g.id ? 700 : 400,
                color: bottomNavId === g.id ? '#e2e8f0' : '#475569',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.1s ease',
              }}
            >
              {g.group === 'Combined' ? '◉ ' : '· '}{g.label}
            </button>
          ))}
        </div>
      )}

      {/* Native sub-selector */}
      {isNative && (
        <div style={{
          height: 40,
          flexShrink: 0,
          background: '#0f0a04',
          borderBottom: '1px solid #2d1a08',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 4,
          overflowX: 'auto',
        }}>
          {NATIVE_GRAPHS.map((g) => (
            <button
              key={g.id}
              onClick={() => handleNativeSwitch(g.id)}
              style={{
                background: nativeId === g.id ? '#2d1a08' : 'transparent',
                border: nativeId === g.id ? '1px solid #f97316' : '1px solid transparent',
                borderRadius: 4,
                padding: '2px 9px',
                cursor: 'pointer',
                fontSize: 9,
                fontWeight: nativeId === g.id ? 700 : 400,
                color: nativeId === g.id ? '#f97316' : '#6b4226',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.1s ease',
              }}
            >
              {g.group === 'App' ? '◉ ' : '· '}{g.label}
            </button>
          ))}
          <Divider />
          <span style={{ fontSize: 8, color: '#6b4226', fontWeight: 800, letterSpacing: '0.1em', padding: '0 4px', whiteSpace: 'nowrap' }}>
            FEATURE
          </span>
          {nativeFeatures.map((feature) => (
            <button
              key={feature.id}
              onClick={() => handleNativeFeatureSwitch(feature.id)}
              title={`${feature.count} native nodes`}
              style={{
                background: nativeFeature === feature.id ? '#2d1a08' : 'transparent',
                border: nativeFeature === feature.id ? '1px solid #f97316' : '1px solid #2d1a0800',
                borderRadius: 4,
                padding: '2px 8px',
                cursor: 'pointer',
                fontSize: 9,
                fontWeight: nativeFeature === feature.id ? 800 : 500,
                color: nativeFeature === feature.id ? '#fed7aa' : '#8b5a2b',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.1s ease',
              }}
            >
              {feature.label} <span style={{ color: nativeFeature === feature.id ? '#f97316' : '#5f3a1e' }}>{feature.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Architect sub-selector */}
      {isArchitect && (
        <div style={{
          height: 32,
          flexShrink: 0,
          background: '#071a0f',
          borderBottom: '1px solid #0d2e1a',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 4,
          overflowX: 'auto',
        }}>
          {ARCHITECT_GRAPHS.map((g) => (
            <button
              key={g.id}
              onClick={() => handleArchitectSwitch(g.id)}
              style={{
                background: architectId === g.id ? '#0d2e1a' : 'transparent',
                border: architectId === g.id ? '1px solid #10b981' : '1px solid transparent',
                borderRadius: 4,
                padding: '2px 9px',
                cursor: 'pointer',
                fontSize: 9,
                fontWeight: architectId === g.id ? 700 : 400,
                color: architectId === g.id ? '#10b981' : '#2d6a4f',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.1s ease',
              }}
            >
              {g.group === 'Feature' ? '◈ ' : '· '}{g.label}
            </button>
          ))}
        </div>
      )}

      {/* DAL Map feature selector */}
      {isDALMap && (
        <div style={{
          height: 32,
          flexShrink: 0,
          background: '#040f0a',
          borderBottom: '1px solid #0a2e1a',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 4,
          overflowX: 'auto',
        }}>
          {DAL_FEATURES.map((feat) => (
            <button
              key={feat}
              onClick={() => { setDalFeature(feat); setSelectedNode(null) }}
              style={{
                background: dalFeature === feat ? '#0d2e1a' : 'transparent',
                border: dalFeature === feat ? '1px solid #34d399' : '1px solid transparent',
                borderRadius: 4,
                padding: '2px 9px',
                cursor: 'pointer',
                fontSize: 9,
                fontWeight: dalFeature === feat ? 700 : 400,
                color: dalFeature === feat ? '#34d399' : '#1a5c3a',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                textTransform: 'lowercase',
                transition: 'all 0.1s ease',
              }}
            >
              {feat}
            </button>
          ))}
        </div>
      )}

      {/* Canvas + Inspector */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ArchitectureGraph
          key={activeGraphKey}
          onNodeSelect={setSelectedNode}
          graphType={(isBottomNav || isArchitect || isNative || isSource || isDALMap) ? undefined : mode}
          nodes={propNodes}
          edges={propEdges}
        />
        <InspectorPanel node={selectedNode} />
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 14, background: '#1e293b', flexShrink: 0 }} />
}

function ModeTab({ label, active, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#1e293b' : 'none',
        border: active ? `1px solid ${accent || '#334155'}` : '1px solid transparent',
        borderRadius: 5,
        padding: '3px 10px',
        cursor: 'pointer',
        fontSize: 9,
        fontWeight: 700,
        color: active ? (accent || '#e2e8f0') : '#334155',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        transition: 'all 0.12s ease',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  )
}

const NATIVE_LAYER_ORDER = ['nav', 'route', 'screen', 'view', 'store', 'controller', 'dal', 'model', 'table']
const NATIVE_LAYER_X = Object.fromEntries(NATIVE_LAYER_ORDER.map((layer, index) => [layer, index * 260]))

function buildNativeFeatureOptions(graph) {
  if (!graph?.nodes) return [{ id: 'all', label: 'All', count: 0 }]

  const counts = new Map()
  for (const node of graph.nodes) {
    const layer = node.data?.layer || node.data?.nodeType
    if (layer === 'table') continue
    const feature = getNativeFeature(node)
    counts.set(feature, (counts.get(feature) || 0) + 1)
  }

  const preferred = ['Profile', 'Booking', 'Dashboard', 'PublicMenu', 'Settings', 'Feed', 'Inbox', 'Chat', 'Auth']
  const all = [{ id: 'all', label: 'All', count: graph.nodes.length }]
  const featureRows = [...counts.entries()]
    .filter(([feature]) => feature !== 'DB Tables')
    .sort(([a], [b]) => {
      const ai = preferred.indexOf(a)
      const bi = preferred.indexOf(b)
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      return a.localeCompare(b)
    })
    .map(([feature, count]) => ({ id: feature, label: feature, count }))

  return [...all, ...featureRows]
}

function buildNativeOrganizationGraph(graph, feature) {
  const sourceNodes = graph.nodes || []
  const sourceEdges = graph.edges || []
  const initialNodeIDs = new Set()

  for (const node of sourceNodes) {
    if (feature === 'all' || getNativeFeature(node) === feature) {
      initialNodeIDs.add(node.id)
    }
  }

  const includedNodeIDs = new Set(initialNodeIDs)
  if (feature !== 'all') {
    for (const edge of sourceEdges) {
      if (initialNodeIDs.has(edge.source)) includedNodeIDs.add(edge.target)
      if (initialNodeIDs.has(edge.target)) includedNodeIDs.add(edge.source)
    }
  }

  const filteredNodes = sourceNodes.filter((node) => includedNodeIDs.has(node.id))
  const filteredEdges = sourceEdges.filter((edge) => includedNodeIDs.has(edge.source) && includedNodeIDs.has(edge.target))
  const rowCounters = new Map()
  const sortedNodes = [...filteredNodes].sort(compareNativeNodes)

  const nodes = sortedNodes.map((node) => {
    const layer = node.data?.layer || node.data?.nodeType || 'view'
    const layerIndex = NATIVE_LAYER_ORDER.includes(layer) ? NATIVE_LAYER_ORDER.indexOf(layer) : NATIVE_LAYER_ORDER.indexOf('view')
    const key = layer
    const row = rowCounters.get(key) || 0
    rowCounters.set(key, row + 1)

    return {
      ...node,
      position: {
        x: NATIVE_LAYER_X[layer] ?? layerIndex * 260,
        y: row * 84,
      },
      data: {
        ...node.data,
        nativeFeature: getNativeFeature(node),
      },
    }
  })

  return {
    ...graph,
    nodes,
    edges: filteredEdges,
  }
}

function compareNativeNodes(a, b) {
  const aLayer = a.data?.layer || a.data?.nodeType || ''
  const bLayer = b.data?.layer || b.data?.nodeType || ''
  const aLayerIndex = NATIVE_LAYER_ORDER.indexOf(aLayer)
  const bLayerIndex = NATIVE_LAYER_ORDER.indexOf(bLayer)
  if (aLayerIndex !== bLayerIndex) return (aLayerIndex === -1 ? 999 : aLayerIndex) - (bLayerIndex === -1 ? 999 : bLayerIndex)

  const aFeature = getNativeFeature(a)
  const bFeature = getNativeFeature(b)
  if (aFeature !== bFeature) return aFeature.localeCompare(bFeature)

  return String(a.data?.label || a.id).localeCompare(String(b.data?.label || b.id))
}

function getNativeFeature(node) {
  const filePath = node.data?.filePath || node.data?.file || ''
  const match = filePath.match(/\/Features\/([^/]+)/)
  if (match) return match[1]
  if ((node.data?.layer || node.data?.nodeType) === 'table') return 'DB Tables'
  if (filePath.includes('/App/')) return 'App'
  if (filePath.includes('/Navigation/')) return 'Navigation'
  if (filePath.includes('/Services/')) return 'Services'
  if (filePath.includes('/Session/')) return 'Session'
  if (filePath.includes('/Shared/')) return 'Shared'
  if (filePath.includes('/DesignSystem/')) return 'DesignSystem'
  return 'Other'
}
