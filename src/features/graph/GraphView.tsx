import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Position,
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

  const isolatedIds = useMemo(
    () => new Set(isolated.map(el => el.id)),
    [isolated],
  )

  const connectedNodes = useMemo(
    () => initialNodes.filter(n => !isolatedIds.has(n.id)),
    [initialNodes, isolatedIds],
  )

  const layoutedNodes = useMemo(
    () => applyDagreLayout(connectedNodes, initialEdges),
    [connectedNodes, initialEdges],
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

  // Nodes connected by at least one visible edge (respects active filters)
  const activeByFilter = useMemo(() => {
    const active = new Set<string>()
    visibleEdges.forEach(e => { active.add(e.source); active.add(e.target) })
    return active
  }, [visibleEdges])

  const allFiltersOn = useMemo(
    () => Object.values(filters).every(Boolean),
    [filters],
  )

  const nodesWithState = useMemo(() => {
    return layoutedNodes.map(node => {
      const fadedByFocus = focusedNeighbors ? !focusedNeighbors.has(node.id) : false
      const fadedByFilter = !allFiltersOn && !activeByFilter.has(node.id)
      return {
        ...node,
        selected: node.id === focusedId,
        className: fadedByFocus || fadedByFilter ? 'poo-node--opaque' : '',
      }
    })
  }, [layoutedNodes, focusedId, focusedNeighbors, activeByFilter, allFiltersOn])

  // Build a position lookup from the laid-out nodes
  const nodePos = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>()
    layoutedNodes.forEach(n => map.set(n.id, n.position))
    return map
  }, [layoutedNodes])

  const edgesWithState = useMemo(() => {
    const SPREAD = 14

    // Group edges by source and by target to compute spread offsets
    const bySource = new Map<string, string[]>()
    const byTarget = new Map<string, string[]>()
    visibleEdges.forEach(e => {
      if (!bySource.has(e.source)) bySource.set(e.source, [])
      bySource.get(e.source)!.push(e.id)
      if (!byTarget.has(e.target)) byTarget.set(e.target, [])
      byTarget.get(e.target)!.push(e.id)
    })

    // 7 distinct mid-fractions so horizontal segments land at different heights
    const MID_FRACTIONS = [0.3, 0.4, 0.5, 0.6, 0.7, 0.35, 0.65]

    return visibleEdges.map((edge, globalIdx) => {
      const srcGroup = bySource.get(edge.source)!
      const tgtGroup = byTarget.get(edge.target)!
      const srcIdx = srcGroup.indexOf(edge.id)
      const tgtIdx = tgtGroup.indexOf(edge.id)
      const sourceOffsetX = (srcIdx - (srcGroup.length - 1) / 2) * SPREAD
      const targetOffsetX = (tgtIdx - (tgtGroup.length - 1) / 2) * SPREAD
      const midFraction = MID_FRACTIONS[globalIdx % MID_FRACTIONS.length]

      // Pick source/target handles based on relative node positions
      const sPos = nodePos.get(edge.source)
      const tPos = nodePos.get(edge.target)
      let sourceHandle = 'bottom'
      let targetHandle = 'top'
      let sourcePosition = Position.Bottom
      let targetPosition = Position.Top
      if (sPos && tPos) {
        const dx = tPos.x - sPos.x
        const dy = tPos.y - sPos.y
        if (Math.abs(dx) > Math.abs(dy)) {
          // more horizontal
          if (dx > 0) {
            sourceHandle = 'right'; sourcePosition = Position.Right
            targetHandle = 'left';  targetPosition = Position.Left
          } else {
            sourceHandle = 'left';  sourcePosition = Position.Left
            targetHandle = 'right'; targetPosition = Position.Right
          }
        } else {
          // more vertical
          if (dy > 0) {
            sourceHandle = 'bottom'; sourcePosition = Position.Bottom
            targetHandle = 'top';    targetPosition = Position.Top
          } else {
            sourceHandle = 'top';    sourcePosition = Position.Top
            targetHandle = 'bottom'; targetPosition = Position.Bottom
          }
        }
      }

      return {
        ...edge,
        sourceHandle,
        targetHandle,
        sourcePosition,
        targetPosition,
        hidden: focusedNeighbors
          ? !(focusedNeighbors.has(edge.source) && focusedNeighbors.has(edge.target))
          : false,
        data: { ...edge.data, sourceOffsetX, targetOffsetX, midFraction },
      }
    })
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
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="var(--color-border)" />
        <Controls />
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
