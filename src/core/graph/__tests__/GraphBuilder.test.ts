import { describe, it, expect } from 'vitest'
import { buildGraph } from '../GraphBuilder'
import type { CodeElement } from '../../model/CodeElement'
import type { Relation } from '../../model/Relation'

const makeElement = (overrides: Partial<CodeElement> & { name: string }): CodeElement => ({
  id: overrides.name,
  type: 'class',
  language: 'java',
  attributes: [],
  methods: [],
  filePath: 'Foo.java',
  ...overrides,
})

describe('GraphBuilder — nodes', () => {
  it('creates one node per element', () => {
    const elements = [makeElement({ name: 'Foo' }), makeElement({ name: 'Bar' })]
    const { nodes } = buildGraph(elements, [])
    expect(nodes).toHaveLength(2)
  })

  it('maps element id to node id', () => {
    const elements = [makeElement({ name: 'Foo' })]
    const { nodes } = buildGraph(elements, [])
    expect(nodes[0].id).toBe('Foo')
  })

  it('stores element data in node.data', () => {
    const elements = [makeElement({ name: 'Foo', type: 'interface' })]
    const { nodes } = buildGraph(elements, [])
    expect(nodes[0].data.element.type).toBe('interface')
  })

  it('assigns node type based on element type', () => {
    const types = ['class', 'abstract', 'interface', 'enum', 'record', 'sealed', 'struct', 'object', 'trait', 'dataclass'] as const
    for (const type of types) {
      const { nodes } = buildGraph([makeElement({ name: 'X', type })], [])
      expect(nodes[0].type).toBe(type)
    }
  })
})

describe('GraphBuilder — edges', () => {
  it('creates one edge per relation', () => {
    const elements = [makeElement({ name: 'Dog' }), makeElement({ name: 'Animal' })]
    const relations: Relation[] = [{ source: 'Dog', target: 'Animal', type: 'extends' }]
    const { edges } = buildGraph(elements, relations)
    expect(edges).toHaveLength(1)
  })

  it('maps relation source/target to edge source/target', () => {
    const elements = [makeElement({ name: 'Dog' }), makeElement({ name: 'Animal' })]
    const relations: Relation[] = [{ source: 'Dog', target: 'Animal', type: 'extends' }]
    const { edges } = buildGraph(elements, relations)
    expect(edges[0].source).toBe('Dog')
    expect(edges[0].target).toBe('Animal')
  })

  it('stores relation type in edge type', () => {
    const elements = [makeElement({ name: 'Cat' }), makeElement({ name: 'IPrintable' })]
    const relations: Relation[] = [{ source: 'Cat', target: 'IPrintable', type: 'implements' }]
    const { edges } = buildGraph(elements, relations)
    expect(edges[0].type).toBe('implements')
  })

  it('skips edges where target element does not exist in the graph', () => {
    const elements = [makeElement({ name: 'Cat' })]
    const relations: Relation[] = [{ source: 'Cat', target: 'UnknownExternal', type: 'extends' }]
    const { edges } = buildGraph(elements, relations)
    expect(edges).toHaveLength(0)
  })
})

describe('GraphBuilder — isolated elements', () => {
  it('marks elements with no relations as isolated', () => {
    const elements = [makeElement({ name: 'Util' }), makeElement({ name: 'Dog' }), makeElement({ name: 'Animal' })]
    const relations: Relation[] = [{ source: 'Dog', target: 'Animal', type: 'extends' }]
    const { isolated } = buildGraph(elements, relations)
    expect(isolated).toHaveLength(1)
    expect(isolated[0].name).toBe('Util')
  })

  it('returns empty isolated list when all elements have relations', () => {
    const elements = [makeElement({ name: 'Dog' }), makeElement({ name: 'Animal' })]
    const relations: Relation[] = [{ source: 'Dog', target: 'Animal', type: 'extends' }]
    const { isolated } = buildGraph(elements, relations)
    expect(isolated).toHaveLength(0)
  })
})
