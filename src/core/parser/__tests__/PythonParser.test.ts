// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { createParser } from '../TreeSitterService'
import { PythonParser } from '../languages/PythonParser'
import type { Parser } from 'web-tree-sitter'

let parser: Parser

beforeAll(async () => {
  parser = await createParser('python')
})

function parse(source: string) {
  const tree = parser.parse(source)!
  return new PythonParser().parse(tree, source)
}

describe('PythonParser — element types', () => {
  it('identifies a class', () => {
    const { elements } = parse(`class Foo: pass`)
    expect(elements[0]).toMatchObject({ name: 'Foo', type: 'class', language: 'python' })
  })

  it('identifies a dataclass', () => {
    const { elements } = parse(`
@dataclass
class Point:
    x: int
    y: int
    `)
    expect(elements[0].type).toBe('dataclass')
  })
})

describe('PythonParser — attributes', () => {
  it('extracts type-annotated class variable', () => {
    const { elements } = parse(`
class Foo:
    name: str
    age: int
    `)
    expect(elements[0].attributes).toHaveLength(2)
    expect(elements[0].attributes[0]).toMatchObject({ name: 'name', type: 'str' })
    expect(elements[0].attributes[1]).toMatchObject({ name: 'age', type: 'int' })
  })

  it('sets visibility to public (Python default)', () => {
    const { elements } = parse(`
class Foo:
    name: str
    `)
    expect(elements[0].attributes[0].visibility).toBe('+')
  })
})

describe('PythonParser — methods', () => {
  it('extracts a method with return type', () => {
    const { elements } = parse(`
class Foo:
    def get_name(self) -> str:
        return self.name
    `)
    expect(elements[0].methods[0]).toMatchObject({ name: 'get_name', returnType: 'str' })
  })

  it('ignores __init__ and dunder methods', () => {
    const { elements } = parse(`
class Foo:
    def __init__(self): pass
    def __str__(self): pass
    def get_name(self): pass
    `)
    const names = elements[0].methods.map(m => m.name)
    expect(names).not.toContain('__init__')
    expect(names).not.toContain('__str__')
    expect(names).toContain('get_name')
  })
})

describe('PythonParser — relations', () => {
  it('detects inheritance (extends)', () => {
    const { relations } = parse(`class Dog(Animal): pass`)
    expect(relations.some(r => r.type === 'extends' && r.target === 'Animal')).toBe(true)
  })

  it('detects multiple inheritance as extends', () => {
    const { relations } = parse(`class Cat(Animal, Printable): pass`)
    expect(relations.filter(r => r.type === 'extends')).toHaveLength(2)
  })

  it('detects __init__ parameter type as dependency', () => {
    const { relations } = parse(`
class OrderService:
    def __init__(self, repo: OrderRepository):
        self.repo = repo
    `)
    expect(relations.some(r => r.type === 'parameter' && r.target === 'OrderRepository')).toBe(true)
  })
})
