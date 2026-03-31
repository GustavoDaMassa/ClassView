// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { createParser } from '../TreeSitterService'
import { PhpParser } from '../languages/PhpParser'
import type { Parser } from 'web-tree-sitter'

let parser: Parser

beforeAll(async () => {
  parser = await createParser('php')
})

function parse(source: string) {
  const tree = parser.parse(source)!
  return new PhpParser().parse(tree, source)
}

describe('PhpParser — element types', () => {
  it('identifies a class', () => {
    const { elements } = parse(`<?php class Foo {}`)
    expect(elements[0]).toMatchObject({ name: 'Foo', type: 'class', language: 'php' })
  })

  it('identifies an abstract class', () => {
    const { elements } = parse(`<?php abstract class Base {}`)
    expect(elements[0].type).toBe('abstract')
  })

  it('identifies an interface', () => {
    const { elements } = parse(`<?php interface IPrintable {}`)
    expect(elements[0].type).toBe('interface')
  })

  it('identifies an enum', () => {
    const { elements } = parse(`<?php enum Status { case Active; }`)
    expect(elements[0].type).toBe('enum')
  })

  it('identifies a trait', () => {
    const { elements } = parse(`<?php trait Loggable {}`)
    expect(elements[0].type).toBe('trait')
  })
})

describe('PhpParser — attributes', () => {
  it('extracts private property', () => {
    const { elements } = parse(`<?php class Foo { private string $name; }`)
    expect(elements[0].attributes[0]).toMatchObject({ visibility: '-', name: '$name', type: 'string' })
  })
})

describe('PhpParser — methods', () => {
  it('extracts public method with return type', () => {
    const { elements } = parse(`
      <?php
      class Foo {
        public function getName(): string { return $this->name; }
      }
    `)
    expect(elements[0].methods[0]).toMatchObject({ visibility: '+', name: 'getName', returnType: 'string' })
  })
})

describe('PhpParser — relations', () => {
  it('detects extends', () => {
    const { relations } = parse(`<?php class Dog extends Animal {}`)
    expect(relations.some(r => r.type === 'extends' && r.target === 'Animal')).toBe(true)
  })

  it('detects implements', () => {
    const { relations } = parse(`<?php class Cat implements IPrintable {}`)
    expect(relations.some(r => r.type === 'implements' && r.target === 'IPrintable')).toBe(true)
  })

  it('detects extends and implements together', () => {
    const { relations } = parse(`<?php class Cat extends Animal implements IPrintable {}`)
    expect(relations.find(r => r.type === 'extends')?.target).toBe('Animal')
    expect(relations.find(r => r.type === 'implements')?.target).toBe('IPrintable')
  })
})
