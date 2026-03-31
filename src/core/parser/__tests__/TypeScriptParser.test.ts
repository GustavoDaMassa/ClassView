// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { createParser } from '../TreeSitterService'
import { TypeScriptParser } from '../languages/TypeScriptParser'
import type { Parser } from 'web-tree-sitter'

let parser: Parser

beforeAll(async () => {
  parser = await createParser('typescript')
})

function parse(source: string) {
  const tree = parser.parse(source)!
  return new TypeScriptParser().parse(tree, source)
}

describe('TypeScriptParser — element types', () => {
  it('identifies a class', () => {
    const { elements } = parse(`class Foo {}`)
    expect(elements[0]).toMatchObject({ name: 'Foo', type: 'class', language: 'typescript' })
  })

  it('identifies an abstract class', () => {
    const { elements } = parse(`abstract class Base {}`)
    expect(elements[0].type).toBe('abstract')
  })

  it('identifies an interface', () => {
    const { elements } = parse(`interface IPrintable {}`)
    expect(elements[0].type).toBe('interface')
  })

  it('identifies an enum', () => {
    const { elements } = parse(`enum Status { Active, Inactive }`)
    expect(elements[0].type).toBe('enum')
  })
})

describe('TypeScriptParser — attributes', () => {
  it('extracts private field', () => {
    const { elements } = parse(`
      class Foo {
        private name: string
      }
    `)
    expect(elements[0].attributes[0]).toMatchObject({ visibility: '-', name: 'name', type: 'string' })
  })

  it('extracts public field', () => {
    const { elements } = parse(`
      class Foo {
        public age: number
      }
    `)
    expect(elements[0].attributes[0]).toMatchObject({ visibility: '+', name: 'age', type: 'number' })
  })

  it('defaults to package visibility when no modifier', () => {
    const { elements } = parse(`
      class Foo {
        name: string
      }
    `)
    expect(elements[0].attributes[0].visibility).toBe('~')
  })
})

describe('TypeScriptParser — methods', () => {
  it('extracts public method with return type', () => {
    const { elements } = parse(`
      class Foo {
        getName(): string { return this.name }
      }
    `)
    expect(elements[0].methods[0]).toMatchObject({ name: 'getName', returnType: 'string' })
  })

  it('extracts private method with parameters', () => {
    const { elements } = parse(`
      class Foo {
        private setName(n: string): void {}
      }
    `)
    expect(elements[0].methods[0]).toMatchObject({ visibility: '-', name: 'setName' })
    expect(elements[0].methods[0].params).toContain('string')
  })
})

describe('TypeScriptParser — relations', () => {
  it('detects extends', () => {
    const { relations } = parse(`class Dog extends Animal {}`)
    expect(relations.some(r => r.type === 'extends' && r.target === 'Animal')).toBe(true)
  })

  it('detects implements', () => {
    const { relations } = parse(`class Cat implements IPrintable {}`)
    expect(relations.some(r => r.type === 'implements' && r.target === 'IPrintable')).toBe(true)
  })

  it('detects extends and implements together', () => {
    const { relations } = parse(`class Cat extends Animal implements IPrintable {}`)
    expect(relations.find(r => r.type === 'extends')?.target).toBe('Animal')
    expect(relations.find(r => r.type === 'implements')?.target).toBe('IPrintable')
  })

  it('detects field-type dependency', () => {
    const { relations } = parse(`
      class OrderService {
        private repo: OrderRepository
      }
    `)
    expect(relations.some(r => r.type === 'depends' && r.target === 'OrderRepository')).toBe(true)
  })
})
