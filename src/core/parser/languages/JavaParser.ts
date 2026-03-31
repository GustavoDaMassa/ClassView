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

function getVisibility(modifiers: string[]): Attribute['visibility'] {
  for (const mod of modifiers) {
    if (mod in VISIBILITY_MAP) return VISIBILITY_MAP[mod]
  }
  return '~'
}

function getModifiers(node: SyntaxNode): string[] {
  const mods: string[] = []
  for (const child of children(node)) {
    if (child.type === 'modifiers') {
      for (const mod of children(child)) {
        mods.push(mod.text)
      }
    }
  }
  return mods
}

function getElementType(node: SyntaxNode, modifiers: string[]): ElementType {
  switch (node.type) {
    case 'interface_declaration': return 'interface'
    case 'enum_declaration': return 'enum'
    case 'record_declaration': return 'record'
    case 'class_declaration':
      if (modifiers.includes('abstract')) return 'abstract'
      if (modifiers.includes('sealed')) return 'sealed'
      return 'class'
    default: return 'class'
  }
}

function extractName(node: SyntaxNode): string {
  return node.childForFieldName('name')?.text ?? ''
}

function extractAttributes(bodyNode: SyntaxNode | null): Attribute[] {
  if (!bodyNode) return []
  const attrs: Attribute[] = []

  for (const child of children(bodyNode)) {
    if (child.type === 'field_declaration') {
      const mods = getModifiers(child)
      const visibility = getVisibility(mods)
      const typeNode = child.childForFieldName('type')
      const declarator = children(child).find(c => c.type === 'variable_declarator')
      const nameNode = declarator?.childForFieldName('name')

      if (typeNode && nameNode) {
        attrs.push({ visibility, name: nameNode.text, type: typeNode.text })
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
      const mods = getModifiers(child)
      const visibility = getVisibility(mods)
      const returnTypeNode = child.childForFieldName('type')
      const nameNode = child.childForFieldName('name')
      const paramsNode = child.childForFieldName('parameters')

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

function extractRelations(
  node: SyntaxNode,
  className: string,
): Relation[] {
  const relations: Relation[] = []

  // extends
  const superclass = node.childForFieldName('superclass')
  if (superclass) {
    const target = children(superclass).find(c => c.type === 'type_identifier')?.text
      ?? superclass.text.replace('extends', '').trim()
    relations.push({ source: className, target, type: 'extends' })
  }

  // implements
  const interfaces = node.childForFieldName('interfaces')
  if (interfaces) {
    for (const child of children(interfaces)) {
      if (child.type === 'type_list') {
        for (const t of children(child)) {
          if (t.type === 'type_identifier') {
            relations.push({ source: className, target: t.text, type: 'implements' })
          }
        }
      } else if (child.type === 'type_identifier') {
        relations.push({ source: className, target: child.text, type: 'implements' })
      }
    }
  }

  // field-type dependencies
  const body = node.childForFieldName('body')
  if (body) {
    for (const child of children(body)) {
      if (child.type === 'field_declaration') {
        const typeNode = child.childForFieldName('type')
        if (typeNode && typeNode.type === 'type_identifier') {
          relations.push({ source: className, target: typeNode.text, type: 'depends' })
        }
      }
    }
  }

  return relations
}

const CLASS_NODES = new Set([
  'class_declaration',
  'interface_declaration',
  'enum_declaration',
  'record_declaration',
])

export class JavaParser implements LanguageParser {
  readonly language: Language = 'java'
  readonly extensions = ['.java']

  parse(tree: Tree, _source: string): ParseResult {
    const elements: CodeElement[] = []
    const relations: Relation[] = []

    const visit = (node: SyntaxNode) => {
      if (CLASS_NODES.has(node.type)) {
        const modifiers = getModifiers(node)
        const name = extractName(node)
        if (!name) return

        const type = getElementType(node, modifiers)
        const body = node.childForFieldName('body')

        elements.push({
          id: name,
          name,
          type,
          language: 'java',
          attributes: extractAttributes(body),
          methods: extractMethods(body),
          filePath: '',
        })

        relations.push(...extractRelations(node, name))
      }

      for (const child of children(node)) {
        visit(child)
      }
    }

    visit(tree.rootNode)
    return { elements, relations }
  }
}
