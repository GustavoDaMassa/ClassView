// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { createParser } from '../TreeSitterService'
import { JavaParser } from '../languages/JavaParser'
import type { Parser } from 'web-tree-sitter'

let parser: Parser

beforeAll(async () => {
  parser = await createParser('java')
})

function parse(source: string) {
  const tree = parser.parse(source)!
  return new JavaParser().parse(tree, source)
}

describe('JavaParser — class', () => {
  it('identifies a simple class', () => {
    const { elements } = parse(`public class Foo {}`)
    expect(elements).toHaveLength(1)
    expect(elements[0].name).toBe('Foo')
    expect(elements[0].type).toBe('class')
    expect(elements[0].language).toBe('java')
  })

  it('identifies an abstract class', () => {
    const { elements } = parse(`public abstract class Base {}`)
    expect(elements[0].type).toBe('abstract')
  })

  it('identifies an interface', () => {
    const { elements } = parse(`public interface Printable {}`)
    expect(elements[0].type).toBe('interface')
  })

  it('identifies an enum', () => {
    const { elements } = parse(`public enum Status { ACTIVE, INACTIVE }`)
    expect(elements[0].type).toBe('enum')
  })

  it('identifies a record', () => {
    const { elements } = parse(`public record Point(int x, int y) {}`)
    expect(elements[0].type).toBe('record')
  })

  it('identifies a sealed class', () => {
    const { elements } = parse(`public sealed class Shape permits Circle, Square {}`)
    expect(elements[0].type).toBe('sealed')
  })
})

describe('JavaParser — attributes', () => {
  it('extracts private field', () => {
    const { elements } = parse(`
      public class Foo {
        private String name;
      }
    `)
    expect(elements[0].attributes).toHaveLength(1)
    expect(elements[0].attributes[0]).toMatchObject({ visibility: '-', name: 'name', type: 'String' })
  })

  it('extracts public field', () => {
    const { elements } = parse(`
      public class Foo {
        public int age;
      }
    `)
    expect(elements[0].attributes[0]).toMatchObject({ visibility: '+', name: 'age', type: 'int' })
  })

  it('extracts protected field', () => {
    const { elements } = parse(`
      public class Foo {
        protected boolean active;
      }
    `)
    expect(elements[0].attributes[0]).toMatchObject({ visibility: '#', name: 'active', type: 'boolean' })
  })
})

describe('JavaParser — methods', () => {
  it('extracts public method', () => {
    const { elements } = parse(`
      public class Foo {
        public String getName() { return name; }
      }
    `)
    expect(elements[0].methods).toHaveLength(1)
    expect(elements[0].methods[0]).toMatchObject({
      visibility: '+',
      name: 'getName',
      returnType: 'String',
    })
  })

  it('extracts method with parameters', () => {
    const { elements } = parse(`
      public class Foo {
        public void setName(String name) {}
      }
    `)
    expect(elements[0].methods[0].params).toContain('String')
  })
})

describe('JavaParser — relations', () => {
  it('detects extends', () => {
    const { relations } = parse(`
      public class Dog extends Animal {}
    `)
    expect(relations).toHaveLength(1)
    expect(relations[0]).toMatchObject({ type: 'extends', source: 'Dog', target: 'Animal' })
  })

  it('detects implements', () => {
    const { relations } = parse(`
      public class Cat implements Animal, Printable {}
    `)
    const implRelations = relations.filter(r => r.type === 'implements')
    expect(implRelations).toHaveLength(2)
    expect(implRelations.map(r => r.target)).toEqual(expect.arrayContaining(['Animal', 'Printable']))
  })

  it('detects extends and implements together', () => {
    const { relations } = parse(`
      public class Cat extends Animal implements Printable {}
    `)
    expect(relations.find(r => r.type === 'extends')?.target).toBe('Animal')
    expect(relations.find(r => r.type === 'implements')?.target).toBe('Printable')
  })

  it('detects field-type dependency', () => {
    const { relations } = parse(`
      public class OrderService {
        private OrderRepository repository;
      }
    `)
    expect(relations.some(r => r.type === 'field' && r.target === 'OrderRepository')).toBe(true)
  })
})

describe('JavaParser — multiple classes in one file', () => {
  it('parses all top-level classes', () => {
    const { elements } = parse(`
      public class Foo {}
      class Bar {}
    `)
    expect(elements).toHaveLength(2)
    expect(elements.map(e => e.name)).toEqual(expect.arrayContaining(['Foo', 'Bar']))
  })
})
