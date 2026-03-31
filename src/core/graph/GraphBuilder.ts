import type { Node, Edge } from '@xyflow/react'
import type { CodeElement } from '../model/CodeElement'
import type { Relation } from '../model/Relation'

export interface ElementNodeData extends Record<string, unknown> {
  element: CodeElement
}

export type ElementNode = Node<ElementNodeData>

export function buildGraph(
  elements: CodeElement[],
  relations: Relation[],
): { nodes: ElementNode[]; edges: Edge[]; isolated: CodeElement[] } {
  const elementIds = new Set(elements.map(el => el.id))

  const nodes: ElementNode[] = elements.map(el => ({
    id: el.id,
    type: el.type,
    position: { x: 0, y: 0 },
    data: { element: el },
  }))

  const edges: Edge[] = relations
    .filter(rel => elementIds.has(rel.source) && elementIds.has(rel.target))
    .map((rel, i) => ({
      id: `edge-${i}`,
      source: rel.source,
      target: rel.target,
      type: rel.type,
    }))

  const connectedIds = new Set(edges.flatMap(e => [e.source, e.target]))
  const isolated = elements.filter(el => !connectedIds.has(el.id))

  return { nodes, edges, isolated }
}
