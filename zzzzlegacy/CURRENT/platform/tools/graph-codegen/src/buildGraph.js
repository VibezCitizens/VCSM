const { toNodeId, toLabel } = require('./toNodeId')
const { classifyLayer, layerToNodeType, LAYER_X } = require('./classifyLayer')
const { resolveImportPath } = require('./resolveImportPath')

// Canonical engine definitions — keyed by import alias
const ENGINE_DEFS = {
  '@identity':      { id: 'engine__identity',      label: 'identity engine'       },
  '@hydration':     { id: 'engine__hydration',      label: 'hydration engine'      },
  '@chat':          { id: 'engine__chat',            label: 'chat engine'           },
  '@reviews':       { id: 'engine__reviews',         label: 'reviews engine'        },
  '@portfolio':     { id: 'engine__portfolio',       label: 'portfolio engine'      },
  '@booking':       { id: 'engine__booking',         label: 'booking engine'        },
  '@media':         { id: 'engine__media',           label: 'media engine'          },
  '@notifications': { id: 'engine__notifications',   label: 'notifications runtime' },
  '@i18n':          { id: 'engine__i18n',            label: 'i18n engine'           },
}

// Edge type is inferred from source→target layer pair
function inferEdgeType(sourceLayer, targetLayer) {
  if (
    (sourceLayer === 'screen' || sourceLayer === 'view') &&
    targetLayer === 'component'
  ) return 'renders'
  return 'calls'
}

function buildGraph(fileDataList) {
  const nodeMap   = new Map()   // id → node
  const edgeSet   = new Set()   // dedupe 'srcId→tgtId'
  const edges     = []

  // Track y-index per layer for grid layout
  const layerY = {}

  function nextY(layer) {
    layerY[layer] = (layerY[layer] || 0) + 1
    return (layerY[layer] - 1) * 70
  }

  // ─── Pass 1: create one node per file ───────────────────────────────────────
  for (const { filePath, tables, rpcs } of fileDataList) {
    const layer    = classifyLayer(filePath)
    const nodeType = layerToNodeType(layer)
    const id       = toNodeId(filePath)
    const label    = toLabel(filePath)
    const x        = LAYER_X[layer] !== undefined ? LAYER_X[layer] : 4800
    const y        = nextY(layer)

    nodeMap.set(id, {
      id,
      type: 'archNode',
      position: { x, y },
      data: {
        label,
        nodeType,
        layer,
        filePath,
        riskLevel:      'none',
        confidence:     'STATICALLY_TRACED',
        notes:          '',
        pendingReviews: [],
        dependencies:   [],
        tablesTouched:  tables || [],
        rpcsCalled:     rpcs   || [],
        ownership:      '',
        runtimeStatus:  'UNVERIFIED',
      },
    })
  }

  // ─── Pass 2: resolve imports → edges + engine nodes ─────────────────────────
  for (const { filePath, imports } of fileDataList) {
    const sourceId   = toNodeId(filePath)
    const sourceNode = nodeMap.get(sourceId)
    if (!sourceNode) continue

    for (const { source } of imports) {
      const resolved = resolveImportPath(source, filePath)

      // ── Internal VCSM file ──────────────────────────────────────────────────
      if (resolved.kind === 'internal') {
        const targetId = toNodeId(resolved.path)
        if (!nodeMap.has(targetId)) continue

        const edgeKey = `${sourceId}→${targetId}`
        if (edgeSet.has(edgeKey)) continue
        edgeSet.add(edgeKey)

        const targetLayer = nodeMap.get(targetId).data.layer
        const edgeType    = inferEdgeType(sourceNode.data.layer, targetLayer)

        sourceNode.data.dependencies.push(targetId)
        edges.push({
          id:     `e-${edgeSet.size}`,
          source: sourceId,
          target: targetId,
          type:   'smoothstep',
          data:   { edgeType },
          label:  edgeType,
        })
        continue
      }

      // ── Engine import ───────────────────────────────────────────────────────
      if (resolved.kind === 'engine') {
        const alias  = resolved.alias || source
        const def    = ENGINE_DEFS[alias] || {
          id:    'engine__' + alias.replace(/^@/, '').replace(/\//g, '_'),
          label: alias.replace(/^@/, '') + ' engine',
        }

        if (!nodeMap.has(def.id)) {
          const y = nextY('engine')
          nodeMap.set(def.id, {
            id:   def.id,
            type: 'archNode',
            position: { x: LAYER_X['engine'], y },
            data: {
              label:          def.label,
              nodeType:       'engine',
              layer:          'engine',
              filePath:       resolved.path || '',
              riskLevel:      'none',
              confidence:     'STATICALLY_TRACED',
              notes:          'Shared engine module',
              pendingReviews: [],
              dependencies:   [],
              tablesTouched:  [],
              rpcsCalled:     [],
              ownership:      'Platform',
              runtimeStatus:  'VERIFIED',
            },
          })
        }

        const edgeKey = `${sourceId}→${def.id}`
        if (edgeSet.has(edgeKey)) continue
        edgeSet.add(edgeKey)

        sourceNode.data.dependencies.push(def.id)
        edges.push({
          id:     `e-${edgeSet.size}`,
          source: sourceId,
          target: def.id,
          type:   'smoothstep',
          data:   { edgeType: 'calls' },
          label:  'calls',
        })
      }
    }
  }

  return {
    nodes: [...nodeMap.values()],
    edges,
  }
}

module.exports = { buildGraph }
