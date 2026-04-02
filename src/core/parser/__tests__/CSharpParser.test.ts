// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { createParser } from '../TreeSitterService'
import { CSharpParser } from '../languages/CSharpParser'
import type { Parser } from 'web-tree-sitter'

let parser: Parser

beforeAll(async () => {
  parser = await createParser('csharp')
})

function parse(source: string) {
  const tree = parser.parse(source)!
  return new CSharpParser().parse(tree, source)
}

describe('CSharpParser — element types', () => {
  it('identifies a class', () => {
    const { elements } = parse(`public class Foo {}`)
    expect(elements[0]).toMatchObject({ name: 'Foo', type: 'class', language: 'csharp' })
  })

  it('identifies an abstract class', () => {
    const { elements } = parse(`public abstract class Base {}`)
    expect(elements[0].type).toBe('abstract')
  })

  it('identifies an interface', () => {
    const { elements } = parse(`public interface IPrintable {}`)
    expect(elements[0].type).toBe('interface')
  })

  it('identifies an enum', () => {
    const { elements } = parse(`public enum Status { Active, Inactive }`)
    expect(elements[0].type).toBe('enum')
  })

  it('identifies a record', () => {
    const { elements } = parse(`public record Point(int X, int Y);`)
    expect(elements[0].type).toBe('record')
  })

  it('identifies a sealed class', () => {
    const { elements } = parse(`public sealed class Shape {}`)
    expect(elements[0].type).toBe('sealed')
  })

  it('identifies a struct', () => {
    const { elements } = parse(`public struct Vector { public int X; }`)
    expect(elements[0].type).toBe('struct')
  })
})

describe('CSharpParser — attributes', () => {
  it('extracts private field', () => {
    const { elements } = parse(`
      public class Foo {
        private string _name;
      }
    `)
    expect(elements[0].attributes[0]).toMatchObject({ visibility: '-', name: '_name', type: 'string' })
  })

  it('extracts public property', () => {
    const { elements } = parse(`
      public class Foo {
        public int Age { get; set; }
      }
    `)
    expect(elements[0].attributes[0]).toMatchObject({ visibility: '+', name: 'Age', type: 'int' })
  })
})

describe('CSharpParser — methods', () => {
  it('extracts public method', () => {
    const { elements } = parse(`
      public class Foo {
        public string GetName() { return _name; }
      }
    `)
    expect(elements[0].methods[0]).toMatchObject({ visibility: '+', name: 'GetName', returnType: 'string' })
  })

  it('extracts method with parameters', () => {
    const { elements } = parse(`
      public class Foo {
        private void SetName(string name) {}
      }
    `)
    expect(elements[0].methods[0]).toMatchObject({ visibility: '-', name: 'SetName' })
    expect(elements[0].methods[0].params).toContain('string')
  })
})

describe('CSharpParser — relations', () => {
  it('detects extends (class base without I prefix)', () => {
    const { relations } = parse(`public class Dog : Animal {}`)
    expect(relations.some(r => r.type === 'extends' && r.target === 'Animal')).toBe(true)
  })

  it('detects implements (interface with I prefix)', () => {
    const { relations } = parse(`public class Cat : IPrintable {}`)
    expect(relations.some(r => r.type === 'implements' && r.target === 'IPrintable')).toBe(true)
  })

  it('detects extends and implements together', () => {
    const { relations } = parse(`public class Cat : Animal, IPrintable {}`)
    expect(relations.find(r => r.type === 'extends')?.target).toBe('Animal')
    expect(relations.find(r => r.type === 'implements')?.target).toBe('IPrintable')
  })

  it('detects field-type dependency', () => {
    const { relations } = parse(`
      public class OrderService {
        private OrderRepository _repository;
      }
    `)
    expect(relations.some(r => r.type === 'field' && r.target === 'OrderRepository')).toBe(true)
  })
})
