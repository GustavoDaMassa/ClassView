import type { SyntaxNode, Tree } from '../types'
import { children } from '../types'
import type { LanguageParser, ParseResult } from '../LanguageParser'
import type { CodeElement, Attribute, Method, ElementType, Language } from '../../model/CodeElement'
import type { Relation } from '../../model/Relation'

const VISIBILITY_MAP: Record<string, Attribute['visibility']> = {
  public: '+',
  private: '-',
  protected: '#',
}

function getVisibility(accessibilityNode: SyntaxNode | null): Attribute['visibility'] {
  if (!accessibilityNode) return '~'
  return VISIBILITY_MAP[accessibilityNode.text] ?? '~'
}

function getElementType(node: SyntaxNode): ElementType {
  switch (node.type) {
    case 'abstract_class_declaration': return 'abstract'
    case 'interface_declaration': return 'interface'
    case 'enum_declaration': return 'enum'
    default: return 'class'
  }
}

function extractAttributes(bodyNode: SyntaxNode | null): Attribute[] {
  if (!bodyNode) return []
  const attrs: Attribute[] = []

  for (const child of children(bodyNode)) {
    if (child.type === 'public_field_definition') {
      const accessMod = children(child).find(c => c.type === 'accessibility_modifier') ?? null
      const visibility = getVisibility(accessMod)
      const nameNode = children(child).find(c => c.type === 'property_identifier')
      const typeAnnotation = children(child).find(c => c.type === 'type_annotation')
      const typeNode = (typeAnnotation ? children(typeAnnotation) : []).find(
        c => c.type === 'predefined_type' || c.type === 'type_identifier',
      )

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
    if (child.type === 'method_definition') {
      const accessMod = children(child).find(c => c.type === 'accessibility_modifier') ?? null
      const visibility = getVisibility(accessMod)
      const nameNode = children(child).find(c => c.type === 'property_identifier')
      const paramsNode = children(child).find(c => c.type === 'formal_parameters')
      const typeAnnotation = children(child).find(c => c.type === 'type_annotation')
      const returnTypeNode = (typeAnnotation ? children(typeAnnotation) : []).find(
        c => c.type === 'predefined_type' || c.type === 'type_identifier',
      )

      if (nameNode) {
        methods.push({
          visibility,
          name: nameNode.text,
          returnType: returnTypeNode?.text ?? 'void',
          params: paramsNode?.text ?? '()',
        })
      }
    }
  }

  return methods
}

function collectTypeRefs(node: SyntaxNode, out: Set<string>) {
  if (node.type === 'type_identifier') { out.add(node.text); return }
  for (const child of children(node)) collectTypeRefs(child, out)
}

function extractRelations(node: SyntaxNode, className: string): Relation[] {
  const relations: Relation[] = []

  const heritage = children(node).find(c => c.type === 'class_heritage')
  if (heritage) {
    for (const clause of children(heritage)) {
      if (clause.type === 'extends_clause') {
        const target = children(clause).find(
          c => c.type === 'identifier' || c.type === 'type_identifier',
        )?.text
        if (target) relations.push({ source: className, target, type: 'extends' })
      }
      if (clause.type === 'implements_clause') {
        for (const child of children(clause)) {
          if (child.type === 'type_identifier' || child.type === 'identifier') {
            relations.push({ source: className, target: child.text, type: 'implements' })
          }
        }
      }
    }
  }

  const body = children(node).find(c => c.type === 'class_body' || c.type === 'interface_body') ?? null
  if (!body) return relations

  const fieldTypes = new Set<string>()
  const paramTypes = new Set<string>()
  const returnTypes = new Set<string>()
  const createTypes = new Set<string>()

  for (const member of children(body)) {
    if (member.type === 'public_field_definition') {
      const typeAnnotation = children(member).find(c => c.type === 'type_annotation')
      if (typeAnnotation) collectTypeRefs(typeAnnotation, fieldTypes)
    }

    if (member.type === 'method_definition') {
      const retAnnotation = children(member).find(c => c.type === 'type_annotation')
      if (retAnnotation) collectTypeRefs(retAnnotation, returnTypes)

      const params = children(member).find(c => c.type === 'formal_parameters')
      if (params) {
        for (const p of children(params)) {
          const pType = children(p).find(c => c.type === 'type_annotation')
          if (pType) collectTypeRefs(pType, paramTypes)
        }
      }

      const collectNew = (n: SyntaxNode) => {
        if (n.type === 'new_expression') {
          const typeNode = children(n).find(c => c.type === 'identifier' || c.type === 'type_identifier')
          if (typeNode) createTypes.add(typeNode.text)
        }
        for (const c of children(n)) collectNew(c)
      }
      const mBody = children(member).find(c => c.type === 'statement_block')
      if (mBody) collectNew(mBody)
    }
  }

  for (const target of fieldTypes)  if (target !== className) relations.push({ source: className, target, type: 'field' })
  for (const target of paramTypes)  if (target !== className && !fieldTypes.has(target)) relations.push({ source: className, target, type: 'parameter' })
  for (const target of returnTypes) if (target !== className && !fieldTypes.has(target) && !paramTypes.has(target)) relations.push({ source: className, target, type: 'returns' })
  for (const target of createTypes) if (target !== className && !fieldTypes.has(target) && !paramTypes.has(target) && !returnTypes.has(target)) relations.push({ source: className, target, type: 'creates' })

  return relations
}

const CLASS_NODES = new Set([
  'class_declaration',
  'abstract_class_declaration',
  'interface_declaration',
  'enum_declaration',
])

export class TypeScriptParser implements LanguageParser {
  readonly language: Language = 'typescript'
  readonly extensions = ['.ts', '.tsx']

  parse(tree: Tree, _source: string): ParseResult {
    const elements: CodeElement[] = []
    const relations: Relation[] = []

    const visit = (node: SyntaxNode) => {
      if (CLASS_NODES.has(node.type)) {
        const nameNode = children(node).find(
          c => c.type === 'type_identifier' || c.type === 'identifier',
        )
        if (!nameNode) return

        const name = nameNode.text
        const type = getElementType(node)
        const body = children(node).find(
          c => c.type === 'class_body' || c.type === 'interface_body',
        ) ?? null

        elements.push({
          id: name,
          name,
          type,
          language: 'typescript',
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
