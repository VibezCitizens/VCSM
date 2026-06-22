import { MarkerType } from 'reactflow'
import { edgeTypeConfig } from '../data/graph'

import authLoginRaw from '../data/architect/auth-login.graph.json'

function processNodes(rawNodes) {
  return rawNodes.map((node) => ({
    ...node,
    type: 'archNode',
    data: {
      ...node.data,
      file: node.data.filePath || node.data.file || '',
      risk: node.data.riskLevel || node.data.risk || 'none',
    },
  }))
}

function processEdges(rawEdges) {
  return rawEdges.map((edge) => {
    const ec = edgeTypeConfig[edge.data?.edgeType] || {}
    return {
      ...edge,
      style: ec.style || { stroke: '#334155', strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: ec.stroke || '#334155',
      },
      labelStyle: {
        fill: '#4b5563',
        fontSize: 9,
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 500,
      },
      labelBgStyle: { fill: '#09090b', fillOpacity: 0.9 },
      labelBgPadding: [4, 6],
      labelBgBorderRadius: 3,
    }
  })
}

function buildGraph(raw) {
  return {
    metadata: raw.metadata,
    nodes: processNodes(raw.nodes),
    edges: processEdges(raw.edges),
  }
}

export const ARCHITECT_GRAPHS = [
  {
    id: 'auth-login',
    label: 'Auth / Login',
    group: 'Feature',
    ...buildGraph(authLoginRaw),
  },
]

export function getArchitectGraphById(id) {
  return ARCHITECT_GRAPHS.find((g) => g.id === id) || null
}
