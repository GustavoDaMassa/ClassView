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

  // inheritance: class Dog(Animal)
  const argList = children(node).find(c => c.type === 'argument_list')
  if (argList) {
    for (const child of children(argList)) {
      if (child.type === 'identifier') {
        relations.push({ source: className, target: child.text, type: 'extends' })
      }
    }
  }

  const body = children(node).find(c => c.type === 'block') ?? null
  if (!body) return relations

  const fieldTypes = new Set<string>()
  const paramTypes = new Set<string>()
  const returnTypes = new Set<string>()
  const createTypes = new Set<string>()

  for (const member of children(body)) {
    if (member.type === 'expression_statement') {
      const annAssign = children(member).find(c => c.type === 'assignment')
      if (annAssign) {
        const typeNode = children(annAssign).find(c => c.type === 'type')
        if (typeNode) fieldTypes.add(typeNode.text)
      }
    }

    if (member.type === 'annotated_assignment') {
      const typeNode = children(member).find(c => c.type === 'type' || c.type === 'identifier')
      if (typeNode) fieldTypes.add(typeNode.text)
    }

    if (member.type === 'function_definition') {
      const nameNode = children(member).find(c => c.type === 'identifier')
      if (!nameNode) continue

      const params = children(member).find(c => c.type === 'parameters')
      if (params) {
        for (const param of children(params)) {
          if (param.type === 'typed_parameter') {
            const typeNode = children(param).find(c => c.type === 'type')
            if (typeNode) paramTypes.add(typeNode.text)
          }
        }
      }

      const retType = children(member).find(c => c.type === 'type')
      if (retType) returnTypes.add(retType.text)

      const collectCalls = (n: SyntaxNode) => {
        if (n.type === 'call') {
          const fn = children(n).find(c => c.type === 'identifier' || c.type === 'attribute')
          const name = fn?.text?.split('.').pop() ?? ''
          if (name && /^[A-Z]/.test(name)) createTypes.add(name)
        }
        for (const c of children(n)) collectCalls(c)
      }
      const fnBody = children(member).find(c => c.type === 'block')
      if (fnBody) collectCalls(fnBody)
    }
  }

  for (const target of fieldTypes)  if (target !== className) relations.push({ source: className, target, type: 'field' })
  for (const target of paramTypes)  if (target !== className && !fieldTypes.has(target)) relations.push({ source: className, target, type: 'parameter' })
  for (const target of returnTypes) if (target !== className && !fieldTypes.has(target) && !paramTypes.has(target)) relations.push({ source: className, target, type: 'returns' })
  for (const target of createTypes) if (target !== className && !fieldTypes.has(target) && !paramTypes.has(target) && !returnTypes.has(target)) relations.push({ source: className, target, type: 'creates' })

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
