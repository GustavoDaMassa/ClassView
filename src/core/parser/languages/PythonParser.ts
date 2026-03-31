import type { SyntaxNode, Tree } from '../types'
import { children } from '../types'
import type { LanguageParser, ParseResult } from '../LanguageParser'
import type { CodeElement, Attribute, Method, ElementType, Language } from '../../model/CodeElement'
import type { Relation } from '../../model/Relation'

const DUNDER = /^__\w+__$/

function hasDecorator(node: SyntaxNode, name: string): boolean {
  const prev = node.previousNamedSibling
  if (prev?.type === 'decorated_definition') return false

  // decorated_definition wraps the class_definition
  const parent = node.parent
  if (parent?.type === 'decorated_definition') {
    for (const child of children(parent)) {
      if (child.type === 'decorator' && child.text.includes(name)) return true
    }
  }
  return false
}

function getElementType(node: SyntaxNode): ElementType {
  if (hasDecorator(node, 'dataclass')) return 'dataclass'
  return 'class'
}

function extractAttributes(bodyNode: SyntaxNode | null): Attribute[] {
  if (!bodyNode) return []
  const attrs: Attribute[] = []

  for (const child of children(bodyNode)) {
    if (child.type === 'expression_statement') {
      const assignment = children(child).find(c => c.type === 'assignment')
      if (!assignment) continue

      const nameNode = children(assignment).find(c => c.type === 'identifier')
      const typeNode = children(assignment).find(c => c.type === 'type')

      if (nameNode && typeNode) {
        attrs.push({ visibility: '+', name: nameNode.text, type: typeNode.text })
      }
    }
  }

  return attrs
}

function extractMethods(bodyNode: SyntaxNode | null): Method[] {
  if (!bodyNode) return []
  const methods: Method[] = []

  for (const child of children(bodyNode)) {
    if (child.type === 'function_definition') {
      const nameNode = children(child).find(c => c.type === 'identifier')
      if (!nameNode || DUNDER.test(nameNode.text)) continue

      const paramsNode = children(child).find(c => c.type === 'parameters')
      const returnTypeNode = children(child).find(c => c.type === 'type')

      methods.push({
        visibility: '+',
        name: nameNode.text,
        returnType: returnTypeNode?.text ?? '',
        params: paramsNode?.text ?? '()',
      })
    }
  }

  return methods
}

function extractRelations(node: SyntaxNode, className: string): Relation[] {
  const relations: Relation[] = []

  // inheritance via argument_list: class Dog(Animal)
  const argList = children(node).find(c => c.type === 'argument_list')
  if (argList) {
    for (const child of children(argList)) {
      if (child.type === 'identifier') {
        relations.push({ source: className, target: child.text, type: 'extends' })
      }
    }
  }

  // dependencies from __init__ typed parameters
  const body = children(node).find(c => c.type === 'block') ?? null
  if (body) {
    for (const child of children(body)) {
      if (child.type === 'function_definition') {
        const nameNode = children(child).find(c => c.type === 'identifier')
        if (nameNode?.text !== '__init__') continue

        const params = children(child).find(c => c.type === 'parameters')
        if (!params) continue

        for (const param of children(params)) {
          if (param.type === 'typed_parameter') {
            const typeNode = children(param).find(c => c.type === 'type')
            if (typeNode && typeNode.text !== className) {
              relations.push({ source: className, target: typeNode.text, type: 'depends' })
            }
          }
        }
      }
    }
  }

  return relations
}

export class PythonParser implements LanguageParser {
  readonly language: Language = 'python'
  readonly extensions = ['.py']

  parse(tree: Tree, _source: string): ParseResult {
    const elements: CodeElement[] = []
    const relations: Relation[] = []

    const visit = (node: SyntaxNode) => {
      if (node.type === 'class_definition') {
        const nameNode = children(node).find(c => c.type === 'identifier')
        if (!nameNode) return

        const name = nameNode.text
        const type = getElementType(node)
        const body = children(node).find(c => c.type === 'block') ?? null

        elements.push({
          id: name,
          name,
          type,
          language: 'python',
          attributes: extractAttributes(body),
          methods: extractMethods(body),
          filePath: '',
        })

        relations.push(...extractRelations(node, name))
      }

      for (const child of children(node)) visit(child)
    }

    visit(tree.rootNode)
    return { elements, relations }
  }
}
