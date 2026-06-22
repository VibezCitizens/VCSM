import { MarkerType } from 'reactflow'
import { edgeTypeConfig } from '../data/graph'
import rawGraph from '../data/home-feed.graph.json'

export const graphMetadata = rawGraph.metadata

export const processedNodes = rawGraph.nodes.map((node) => ({
  ...node,
  type: 'archNode',
}))

export const processedEdges = rawGraph.edges.map((edge) => {
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
