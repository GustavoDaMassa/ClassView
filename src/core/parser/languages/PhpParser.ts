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

function getVisibility(node: SyntaxNode): Attribute['visibility'] {
  const mod = children(node).find(c => c.type === 'visibility_modifier')
  return VISIBILITY_MAP[mod?.text ?? ''] ?? '~'
}

function getElementType(node: SyntaxNode): ElementType {
  switch (node.type) {
    case 'interface_declaration': return 'interface'
    case 'enum_declaration': return 'enum'
    case 'trait_declaration': return 'trait'
    case 'class_declaration':
      if (children(node).some(c => c.type === 'abstract_modifier')) return 'abstract'
      return 'class'
    default: return 'class'
  }
}

function extractAttributes(bodyNode: SyntaxNode | null): Attribute[] {
  if (!bodyNode) return []
  const attrs: Attribute[] = []

  for (const child of children(bodyNode)) {
    if (child.type === 'property_declaration') {
      const visibility = getVisibility(child)
      const typeNode = children(child).find(c => c.type === 'primitive_type' || c.type === 'named_type')
      const propElement = children(child).find(c => c.type === 'property_element')

      if (propElement) {
        attrs.push({ visibility, name: propElement.text, type: typeNode?.text ?? '' })
      }
    }
  }

  return attrs
}

function extractMethods(bodyNode: SyntaxNode | null): Method[] {
  if (!bodyNode) return []
  const methods: Method[] = []

  for (const child of children(bodyNode)) {
    if (child.type === 'method_declaration') {
      const visibility = getVisibility(child)
      const nameNode = children(child).find(c => c.type === 'name')
      const paramsNode = children(child).find(c => c.type === 'formal_parameters')
      const returnTypeNode = children(child).find(
        c => c.type === 'primitive_type' || c.type === 'named_type',
      )

      if (nameNode) {
        methods.push({
          visibility,
          name: nameNode.text,
          returnType: returnTypeNode?.text ?? '',
          params: paramsNode?.text ?? '()',
        })
      }
    }
  }

  return methods
}

function extractRelations(node: SyntaxNode, className: string): Relation[] {
  const relations: Relation[] = []

  const baseClause = children(node).find(c => c.type === 'base_clause')
  if (baseClause) {
    const target = children(baseClause).find(c => c.type === 'name')?.text
    if (target) relations.push({ source: className, target, type: 'extends' })
  }

  const ifaceClause = children(node).find(c => c.type === 'class_interface_clause')
  if (ifaceClause) {
    for (const child of children(ifaceClause)) {
      if (child.type === 'name') {
        relations.push({ source: className, target: child.text, type: 'implements' })
      }
    }
  }

  return relations
}

const CLASS_NODES = new Set([
  'class_declaration',
  'interface_declaration',
  'enum_declaration',
  'trait_declaration',
])

export class PhpParser implements LanguageParser {
  readonly language: Language = 'php'
  readonly extensions = ['.php']

  parse(tree: Tree, _source: string): ParseResult {
    const elements: CodeElement[] = []
    const relations: Relation[] = []

    const visit = (node: SyntaxNode) => {
      if (CLASS_NODES.has(node.type)) {
        const nameNode = children(node).find(c => c.type === 'name')
        if (!nameNode) return

        const name = nameNode.text
        const type = getElementType(node)
        const body = children(node).find(c => c.type === 'declaration_list') ?? null

        elements.push({
          id: name,
          name,
          type,
          language: 'php',
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
