import { MarkerType } from 'reactflow'
import { edgeTypeConfig } from '../data/graph'
import sourceRaw from '../data/source-imports.graph.json'

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

export const sourceGraph = {
  metadata: sourceRaw.metadata,
  nodes:    processNodes(sourceRaw.nodes),
  edges:    processEdges(sourceRaw.edges),
}
