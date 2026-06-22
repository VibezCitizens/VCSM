import { useCallback, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import ArchNode from './ArchNode'
import { commandNodeTypeConfig } from '../data/commandGraph'
import { nodeTypeConfig as feedNodeTypeConfig } from '../data/graph'
import { processedNodes as commandNodes, processedEdges as commandEdges } from '../lib/loadCommandGraph'
import { processedNodes as feedNodes, processedEdges as feedEdges } from '../lib/loadGraph'

const nodeTypes = { archNode: ArchNode }
const allConfigs = { ...feedNodeTypeConfig, ...commandNodeTypeConfig }

export default function ArchitectureGraph({ onNodeSelect, graphType, nodes: propNodes, edges: propEdges }) {
  const legacyNodes = graphType === 'commands' ? commandNodes : feedNodes
  const legacyEdges = graphType === 'commands' ? commandEdges : feedEdges
  const activeNodes = propNodes ?? legacyNodes
  const activeEdges = propEdges ?? legacyEdges

  const [nodes, setNodes, onNodesChange] = useNodesState(activeNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(activeEdges)

  useEffect(() => {
    setNodes(propNodes ?? legacyNodes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propNodes, graphType])

  useEffect(() => {
    setEdges(propEdges ?? legacyEdges)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propEdges, graphType])

  const onNodeClick = useCallback(
    (_, node) => onNodeSelect({ id: node.id, ...node.data }),
    [onNodeSelect]
  )

  const onPaneClick = useCallback(
    () => onNodeSelect(null),
    [onNodeSelect]
  )

  const miniMapNodeColor = useCallback(
    (node) => allConfigs[node.data?.nodeType]?.color || '#334155',
    []
  )

  return (
    <ReactFlow
      key={propNodes ? `dyn-${activeNodes.length}-${activeNodes[0]?.id ?? ''}` : graphType}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      fitView
      fitViewOptions={{ padding: 0.12 }}
      style={{ background: '#09090b' }}
    >
      <Background color="#1a2332" gap={28} size={1} />
      <Controls style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 6 }} />
      <MiniMap
        style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 6 }}
        nodeColor={miniMapNodeColor}
        maskColor="rgba(9,9,11,0.8)"
      />
    </ReactFlow>
  )
}
