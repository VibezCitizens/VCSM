const path = require('path')
const { classifySwiftLayer, layerToNodeType, NATIVE_LAYER_X } = require('./classifySwiftLayer')
const { primarySymbol } = require('./extractSwiftSymbols')
const { extractNativeSupabaseCalls } = require('./extractNativeSupabaseCalls')

const NATIVE_ROOT = '/Users/vcsm/Documents/New project/native'

function toNodeId(filePath) {
  return path.relative(NATIVE_ROOT, filePath)
    .replace(/\//g, '__')
    .replace(/\s+/g, '_')
    .replace(/\.swift$/, '')
    .toLowerCase()
}

function toLabel(filePath) {
  const sym = primarySymbol(filePath)
  if (sym) return sym
  return path.basename(filePath, '.swift')
}

function toRelPath(filePath) {
  return path.relative(NATIVE_ROOT, filePath)
}

function buildNativeGraph(swiftFiles) {
  const nodeMap  = new Map()
  const edgeSet  = new Set()
  const edges    = []
  const layerY   = {}

  function nextY(layer) {
    layerY[layer] = (layerY[layer] || 0) + 1
    return (layerY[layer] - 1) * 80
  }

  // ── Pass 1: create one node per file ─────────────────────────────────────
  const fileDataList = []

  for (const filePath of swiftFiles) {
    const layer    = classifySwiftLayer(filePath)
    const nodeType = layerToNodeType(layer)
    const id       = toNodeId(filePath)
    const label    = toLabel(filePath)
    const x        = NATIVE_LAYER_X[layer] !== undefined ? NATIVE_LAYER_X[layer] : 2600
    const y        = nextY(layer)
    const relPath  = toRelPath(filePath)

    let supabase = { tables: [], rpcs: [], ops: [], hasWrites: false }
    try {
      supabase = extractNativeSupabaseCalls(filePath)
    } catch {}

    const riskLevel = supabase.hasWrites ? 'medium' : 'none'

    nodeMap.set(id, {
      id,
      type: 'archNode',
      position: { x, y },
      data: {
        label,
        nodeType,
        layer,
        filePath: relPath,
        riskLevel,
        confidence:     'STATICALLY_TRACED',
        notes:          '',
        pendingReviews: [],
        dependencies:   [],
        tablesTouched:  supabase.tables,
        rpcsCalled:     supabase.rpcs,
        ownership:      '',
        runtimeStatus:  'UNVERIFIED',
      },
    })

    fileDataList.push({ id, filePath, layer, supabase })
  }

  // ── Pass 2: DB table nodes ────────────────────────────────────────────────
  const allTables = new Set()
  for (const { supabase } of fileDataList) {
    for (const t of supabase.tables) allTables.add(t)
  }

  for (const table of allTables) {
    const id = `table__${table}`
    if (!nodeMap.has(id)) {
      nodeMap.set(id, {
        id,
        type: 'archNode',
        position: { x: NATIVE_LAYER_X.table, y: nextY('table') },
        data: {
          label:          table,
          nodeType:       'table',
          layer:          'table',
          filePath:       '',
          riskLevel:      'none',
          confidence:     'STATICALLY_TRACED',
          notes:          'DB table (Supabase)',
          pendingReviews: [],
          dependencies:   [],
          tablesTouched:  [],
          rpcsCalled:     [],
          ownership:      'Database',
          runtimeStatus:  'VERIFIED',
        },
      })
    }
  }

  // ── Pass 3: DAL → DB table edges ─────────────────────────────────────────
  for (const { id, layer, supabase } of fileDataList) {
    if (layer !== 'dal') continue
    const sourceNode = nodeMap.get(id)
    if (!sourceNode) continue

    for (const table of supabase.tables) {
      const targetId  = `table__${table}`
      const edgeKey   = `${id}→${targetId}`
      if (edgeSet.has(edgeKey)) continue
      edgeSet.add(edgeKey)

      const hasWrite = supabase.ops.some(o => o.table === table && o.isWrite)
      const edgeType = hasWrite ? 'writes' : 'reads'

      sourceNode.data.dependencies.push(targetId)
      edges.push({
        id:     `e-${edgeSet.size}`,
        source: id,
        target: targetId,
        type:   'smoothstep',
        data:   { edgeType },
        label:  edgeType,
      })
    }
  }

  // ── Pass 4: infer layer chain edges (store→dal, screen→store, nav→screen) ─
  // Group by feature folder
  const featureGroups = new Map()
  for (const { id, filePath, layer } of fileDataList) {
    // Derive feature from path: Features/FeatureName/...
    const m = filePath.match(/Features\/([^/]+)/)
    const feature = m ? m[1] : '__app'
    if (!featureGroups.has(feature)) featureGroups.set(feature, [])
    featureGroups.get(feature).push({ id, layer })
  }

  for (const [, members] of featureGroups) {
    const byLayer = {}
    for (const { id, layer } of members) {
      if (!byLayer[layer]) byLayer[layer] = []
      byLayer[layer].push(id)
    }

    // Wire: screen → store
    for (const screenId of (byLayer.screen || [])) {
      for (const storeId of (byLayer.store || [])) {
        addEdge(screenId, storeId, 'calls')
      }
    }

    // Wire: store → controller (service)
    for (const storeId of (byLayer.store || [])) {
      for (const ctrlId of (byLayer.controller || [])) {
        addEdge(storeId, ctrlId, 'calls')
      }
    }

    // Wire: controller → dal
    for (const ctrlId of (byLayer.controller || [])) {
      for (const dalId of (byLayer.dal || [])) {
        addEdge(ctrlId, dalId, 'calls')
      }
    }

    // Wire: store → dal (when no controller in feature)
    if (!(byLayer.controller || []).length) {
      for (const storeId of (byLayer.store || [])) {
        for (const dalId of (byLayer.dal || [])) {
          addEdge(storeId, dalId, 'calls')
        }
      }
    }
  }

  function addEdge(sourceId, targetId, edgeType) {
    if (!nodeMap.has(sourceId) || !nodeMap.has(targetId)) return
    const edgeKey = `${sourceId}→${targetId}`
    if (edgeSet.has(edgeKey)) return
    edgeSet.add(edgeKey)
    const sourceNode = nodeMap.get(sourceId)
    sourceNode.data.dependencies.push(targetId)
    edges.push({
      id:     `e-${edgeSet.size}`,
      source: sourceId,
      target: targetId,
      type:   'smoothstep',
      data:   { edgeType },
      label:  edgeType,
    })
  }

  return {
    nodes: [...nodeMap.values()],
    edges,
    allTables: [...allTables].sort(),
  }
}

module.exports = { buildNativeGraph, toNodeId }
