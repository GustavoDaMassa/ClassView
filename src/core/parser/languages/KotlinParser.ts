import type { SyntaxNode, Tree } from '../types'
import { children } from '../types'
import type { LanguageParser, ParseResult } from '../LanguageParser'
import type { CodeElement, Attribute, Method, ElementType, Language } from '../../model/CodeElement'
import type { Relation } from '../../model/Relation'

const VISIBILITY_MAP: Record<string, Attribute['visibility']> = {
  public: '+',
  private: '-',
  protected: '#',
  internal: '~',
}

function getVisibility(modifiersNode: SyntaxNode | null): Attribute['visibility'] {
  if (!modifiersNode) return '+'
  for (const child of children(modifiersNode)) {
    if (child.text in VISIBILITY_MAP) return VISIBILITY_MAP[child.text]
  }
  return '+'
}

function getElementType(node: SyntaxNode): ElementType {
  if (node.type === 'object_declaration') return 'object'

  const hasKeyword = (kw: string) => children(node).some(c => c.type === kw)
  const modifiers = children(node).find(c => c.type === 'modifiers')
  const modText = modifiers?.text ?? ''

  if (hasKeyword('interface')) return 'interface'
  if (hasKeyword('enum')) return 'enum'
  if (modText.includes('data')) return 'record'
  if (modText.includes('sealed')) return 'sealed'
  if (modText.includes('abstract')) return 'abstract'
  return 'class'
}

function extractAttributes(bodyNode: SyntaxNode | null): Attribute[] {
  if (!bodyNode) return []
  const attrs: Attribute[] = []

  for (const child of children(bodyNode)) {
    if (child.type === 'property_declaration') {
      const modifiers = children(child).find(c => c.type === 'modifiers') ?? null
      const visibility = getVisibility(modifiers)
      const varDecl = children(child).find(c => c.type === 'variable_declaration')
      if (!varDecl) continue

      const nameNode = children(varDecl).find(c => c.type === 'simple_identifier')
      const typeNode = children(varDecl).find(c => c.type === 'user_type' || c.type === 'nullable_type')

      if (nameNode) {
        attrs.push({ visibility, name: nameNode.text, type: typeNode?.text ?? '' })
      }
    }
  }

  return attrs
}

function extractMethods(bodyNode: SyntaxNode | null): Method[] {
  if (!bodyNode) return []
  const methods: Method[] = []

  for (const child of children(bodyNode)) {
    if (child.type === 'function_declaration') {
      const modifiers = children(child).find(c => c.type === 'modifiers') ?? null
      const visibility = getVisibility(modifiers)
      const nameNode = children(child).find(c => c.type === 'simple_identifier')
      const paramsNode = children(child).find(c => c.type === 'function_value_parameters')
      const returnTypeNode = children(child).find(c => c.type === 'user_type' || c.type === 'nullable_type')

      if (nameNode) {
        methods.push({
          visibility,
          name: nameNode.text,
          returnType: returnTypeNode?.text ?? 'Unit',
          params: paramsNode?.text ?? '()',
        })
      }
    }
  }

  return methods
}

function collectUserTypes(node: SyntaxNode, out: Set<string>) {
  if (node.type === 'user_type') {
    const name = children(node).find(c => c.type === 'type_identifier')?.text ?? node.text.split('<')[0].trim()
    if (name) out.add(name)
    return // don't recurse into generic args to avoid noise
  }
  for (const child of children(node)) collectUserTypes(child, out)
}

function extractRelations(node: SyntaxNode, className: string): Relation[] {
  const relations: Relation[] = []

  // extends / implements via delegation specifiers
  for (const child of children(node)) {
    if (child.type === 'delegation_specifier') {
      const constructorInvocation = children(child).find(c => c.type === 'constructor_invocation')
      if (constructorInvocation) {
        const target = children(constructorInvocation).find(c => c.type === 'user_type')?.text
          ?? constructorInvocation.text.replace(/\(.*\)/, '').trim()
        relations.push({ source: className, target, type: 'extends' })
      } else {
        const target = children(child).find(c => c.type === 'user_type')?.text ?? child.text.trim()
        relations.push({ source: className, target, type: 'implements' })
      }
    }
  }

  const body = children(node).find(c => c.type === 'class_body') ?? null
  if (!body) return relations

  const fieldTypes = new Set<string>()
  const paramTypes = new Set<string>()
  const returnTypes = new Set<string>()
  const createTypes = new Set<string>()

  for (const member of children(body)) {
    if (member.type === 'property_declaration') {
      const varDecl = children(member).find(c => c.type === 'variable_declaration')
      if (varDecl) collectUserTypes(varDecl, fieldTypes)
    }

    if (member.type === 'function_declaration' || member.type === 'secondary_constructor') {
      const retType = children(member).find(c => c.type === 'user_type' || c.type === 'nullable_type')
      if (retType) collectUserTypes(retType, returnTypes)

      const params = children(member).find(c => c.type === 'function_value_parameters')
      if (params) {
        for (const p of children(params)) {
          const pType = children(p).find(c => c.type === 'user_type' || c.type === 'nullable_type')
          if (pType) collectUserTypes(pType, paramTypes)
        }
      }

      const collectCalls = (n: SyntaxNode) => {
        if (n.type === 'call_expression') {
          const callNode = children(n).find(c => c.type === 'simple_identifier')
          if (callNode && /^[A-Z]/.test(callNode.text)) createTypes.add(callNode.text)
        }
        for (const c of children(n)) collectCalls(c)
      }
      const fnBody = children(member).find(c => c.type === 'block' || c.type === 'function_body')
      if (fnBody) collectCalls(fnBody)
    }
  }

  for (const target of fieldTypes)  if (target !== className) relations.push({ source: className, target, type: 'field' })
  for (const target of paramTypes)  if (target !== className && !fieldTypes.has(target)) relations.push({ source: className, target, type: 'parameter' })
  for (const target of returnTypes) if (target !== className && !fieldTypes.has(target) && !paramTypes.has(target)) relations.push({ source: className, target, type: 'returns' })
  for (const target of createTypes) if (target !== className && !fieldTypes.has(target) && !paramTypes.has(target) && !returnTypes.has(target)) relations.push({ source: className, target, type: 'creates' })

  return relations
}

const CLASS_NODES = new Set(['class_declaration', 'object_declaration'])

export class KotlinParser implements LanguageParser {
  readonly language: Language = 'kotlin'
  readonly extensions = ['.kt']

  parse(tree: Tree, _source: string): ParseResult {
    const elements: CodeElement[] = []
    const relations: Relation[] = []

    const visit = (node: SyntaxNode) => {
      if (CLASS_NODES.has(node.type)) {
        const nameNode = children(node).find(c => c.type === 'type_identifier')
        if (!nameNode) return

        const name = nameNode.text
        const type = getElementType(node)
        const body = children(node).find(c => c.type === 'class_body') ?? null

        elements.push({
          id: name,
          name,
          type,
          language: 'kotlin',
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
