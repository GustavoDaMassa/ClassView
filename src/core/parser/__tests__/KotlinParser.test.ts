// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { createParser } from '../TreeSitterService'
import { KotlinParser } from '../languages/KotlinParser'
import type { Parser } from 'web-tree-sitter'

let parser: Parser

beforeAll(async () => {
  parser = await createParser('kotlin')
})

function parse(source: string) {
  const tree = parser.parse(source)!
  return new KotlinParser().parse(tree, source)
}

describe('KotlinParser — element types', () => {
  it('identifies a class', () => {
    const { elements } = parse(`class Foo`)
    expect(elements[0]).toMatchObject({ name: 'Foo', type: 'class', language: 'kotlin' })
  })

  it('identifies an abstract class', () => {
    const { elements } = parse(`abstract class Base`)
    expect(elements[0].type).toBe('abstract')
  })

  it('identifies an interface', () => {
    const { elements } = parse(`interface Printable`)
    expect(elements[0].type).toBe('interface')
  })

  it('identifies an enum', () => {
    const { elements } = parse(`enum class Status { ACTIVE, INACTIVE }`)
    expect(elements[0].type).toBe('enum')
  })

  it('identifies a data class as record', () => {
    const { elements } = parse(`data class Point(val x: Int, val y: Int)`)
    expect(elements[0].type).toBe('record')
  })

  it('identifies a sealed class', () => {
    const { elements } = parse(`sealed class Shape`)
    expect(elements[0].type).toBe('sealed')
  })

  it('identifies an object as object type', () => {
    const { elements } = parse(`object Singleton { val instance = Singleton }`)
    expect(elements[0]).toMatchObject({ name: 'Singleton', type: 'object' })
  })
})

describe('KotlinParser — attributes', () => {
  it('extracts val property', () => {
    const { elements } = parse(`
      class Foo {
        val name: String = ""
      }
    `)
    expect(elements[0].attributes[0]).toMatchObject({ name: 'name', type: 'String' })
  })

  it('extracts var property', () => {
    const { elements } = parse(`
      class Foo {
        var age: Int = 0
      }
    `)
    expect(elements[0].attributes[0]).toMatchObject({ name: 'age', type: 'Int' })
  })

  it('maps private modifier', () => {
    const { elements } = parse(`
      class Foo {
        private val id: Long = 0
      }
    `)
    expect(elements[0].attributes[0].visibility).toBe('-')
  })
})

describe('KotlinParser — methods', () => {
  it('extracts a fun', () => {
    const { elements } = parse(`
      class Foo {
        fun greet(): String { return "hi" }
      }
    `)
    expect(elements[0].methods[0]).toMatchObject({ name: 'greet', returnType: 'String' })
  })
})

describe('KotlinParser — relations', () => {
  it('detects supertype (extends)', () => {
    const { relations } = parse(`class Dog : Animal()`)
    expect(relations.some(r => r.type === 'extends' && r.target === 'Animal')).toBe(true)
  })

  it('detects interface implementation', () => {
    const { relations } = parse(`class Cat : Printable`)
    expect(relations.some(r => r.type === 'implements' && r.target === 'Printable')).toBe(true)
  })

  it('detects property-type dependency', () => {
    const { relations } = parse(`
      class OrderService {
        private val repository: OrderRepository
      }
    `)
    expect(relations.some(r => r.type === 'field' && r.target === 'OrderRepository')).toBe(true)
  })
})
