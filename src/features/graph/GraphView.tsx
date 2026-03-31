import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from '@xyflow/react'
import type { Edge, NodeMouseHandler } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import type { CodeElement } from '../../core/model/CodeElement'
import type { RelationType } from '../../core/model/Relation'
import { applyDagreLayout } from '../../core/graph/layoutEngine'
import { nodeTypes } from './nodes'
import { edgeTypes } from './edges'
import { useFocusMode } from './useFocusMode'
import { Sidebar } from './Sidebar'
import type { RelationFilter } from './FilterToolbar'
import './GraphView.css'

interface Props {
  initialNodes: ReturnType<typeof import('../../core/graph/GraphBuilder').buildGraph>['nodes']
  initialEdges: Edge[]
  isolated: CodeElement[]
  filters: RelationFilter
}

function GraphCanvas({ initialNodes, initialEdges, isolated, filters }: Props) {
  const { focusedId, focus, clear } = useFocusMode()

  const layoutedNodes = useMemo(
    () => applyDagreLayout(initialNodes, initialEdges),
    [initialNodes, initialEdges],
  )

  const visibleEdges = useMemo(
    () => initialEdges.filter(e => filters[e.type as RelationType] ?? true),
    [initialEdges, filters],
  )

  const focusedNeighbors = useMemo(() => {
    if (!focusedId) return null
    const neighbors = new Set<string>([focusedId])
    visibleEdges.forEach(e => {
      if (e.source === focusedId) neighbors.add(e.target)
      if (e.target === focusedId) neighbors.add(e.source)
    })
    return neighbors
  }, [focusedId, visibleEdges])

  const nodesWithState = useMemo(() => {
    return layoutedNodes.map(node => ({
      ...node,
      selected: node.id === focusedId,
      className: focusedNeighbors && !focusedNeighbors.has(node.id) ? 'poo-node--opaque' : '',
    }))
  }, [layoutedNodes, focusedId, focusedNeighbors])

  const edgesWithState = useMemo(() => {
    return visibleEdges.map(edge => ({
      ...edge,
      hidden: focusedNeighbors
        ? !(focusedNeighbors.has(edge.source) && focusedNeighbors.has(edge.target))
        : false,
    }))
  }, [visibleEdges, focusedNeighbors])

  const [, , onNodesChange] = useNodesState(nodesWithState)
  const [, , onEdgesChange] = useEdgesState(edgesWithState)

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      focus(node.id)
    },
    [focus],
  )

  const handlePaneClick = useCallback(() => {
    clear()
  }, [clear])

  return (
    <div className="graph-view">
      <ReactFlow
        nodes={nodesWithState}
        edges={edgesWithState}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: false }}
      >
        <Background gap={20} size={1} color="var(--color-border)" />
        <Controls />
        <MiniMap
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>
      <Sidebar isolated={isolated} />
    </div>
  )
}

export function GraphView(props: Props) {
  return (
    <ReactFlowProvider>
      <GraphCanvas {...props} />
    </ReactFlowProvider>
  )
}
