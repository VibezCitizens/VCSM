import { MarkerType } from 'reactflow'
import { commandNodes, commandEdges, commandEdgeTypeConfig } from '../data/commandGraph'

export const processedNodes = commandNodes

export const processedEdges = commandEdges.map((edge) => {
  const ec = commandEdgeTypeConfig[edge.data?.edgeType] || {}
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
