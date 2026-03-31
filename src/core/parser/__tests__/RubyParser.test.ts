// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { createParser } from '../TreeSitterService'
import { RubyParser } from '../languages/RubyParser'
import type { Parser } from 'web-tree-sitter'

let parser: Parser

beforeAll(async () => {
  parser = await createParser('ruby')
})

function parse(source: string) {
  const tree = parser.parse(source)!
  return new RubyParser().parse(tree, source)
}

describe('RubyParser — element types', () => {
  it('identifies a class', () => {
    const { elements } = parse(`class Foo\nend`)
    expect(elements[0]).toMatchObject({ name: 'Foo', type: 'class', language: 'ruby' })
  })

  it('identifies a module', () => {
    const { elements } = parse(`module Printable\nend`)
    expect(elements[0]).toMatchObject({ name: 'Printable', type: 'trait' })
  })
})

describe('RubyParser — methods', () => {
  it('extracts a method', () => {
    const { elements } = parse(`
class Foo
  def get_name
    @name
  end
end
    `)
    expect(elements[0].methods[0]).toMatchObject({ name: 'get_name', visibility: '+' })
  })

  it('ignores initialize', () => {
    const { elements } = parse(`
class Foo
  def initialize(repo)
    @repo = repo
  end
  def get_name
    @name
  end
end
    `)
    const names = elements[0].methods.map(m => m.name)
    expect(names).not.toContain('initialize')
    expect(names).toContain('get_name')
  })
})

describe('RubyParser — relations', () => {
  it('detects inheritance (extends)', () => {
    const { relations } = parse(`class Dog < Animal\nend`)
    expect(relations.some(r => r.type === 'extends' && r.target === 'Animal')).toBe(true)
  })
})
