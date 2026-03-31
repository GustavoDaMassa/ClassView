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

function extractRelations(node: SyntaxNode, className: string): Relation[] {
  const relations: Relation[] = []

  for (const child of children(node)) {
    if (child.type === 'delegation_specifier') {
      const constructorInvocation = children(child).find(c => c.type === 'constructor_invocation')

      if (constructorInvocation) {
        // extends: class Dog : Animal()
        const target = children(constructorInvocation).find(c => c.type === 'user_type')?.text
          ?? constructorInvocation.text.replace(/\(.*\)/, '').trim()
        relations.push({ source: className, target, type: 'extends' })
      } else {
        // implements: class Cat : Printable
        const target = children(child).find(c => c.type === 'user_type')?.text
          ?? child.text.trim()
        relations.push({ source: className, target, type: 'implements' })
      }
    }
  }

  // property-type dependencies
  const body = children(node).find(c => c.type === 'class_body') ?? null
  if (body) {
    for (const child of children(body)) {
      if (child.type === 'property_declaration') {
        const varDecl = children(child).find(c => c.type === 'variable_declaration')
        const typeNode = (varDecl ? children(varDecl) : []).find(c => c.type === 'user_type')
        if (typeNode) {
          relations.push({ source: className, target: typeNode.text, type: 'depends' })
        }
      }
    }
  }

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
