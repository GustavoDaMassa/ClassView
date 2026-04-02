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

function collectTypeIdentifiers(node: SyntaxNode, out: Set<string>) {
  if (node.type === 'type_identifier') {
    out.add(node.text)
  }
  for (const child of children(node)) {
    collectTypeIdentifiers(child, out)
  }
}

function extractRelations(node: SyntaxNode, className: string): Relation[] {
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

  const body = node.childForFieldName('body')
  if (!body) return relations

  const fieldTypes = new Set<string>()
  const paramTypes = new Set<string>()
  const returnTypes = new Set<string>()
  const createTypes = new Set<string>()

  for (const member of children(body)) {
    if (member.type === 'field_declaration') {
      const typeNode = member.childForFieldName('type')
      if (typeNode) collectTypeIdentifiers(typeNode, fieldTypes)
    }

    if (member.type === 'method_declaration' || member.type === 'constructor_declaration') {
      const retType = member.childForFieldName('type')
      if (retType) collectTypeIdentifiers(retType, returnTypes)

      const params = member.childForFieldName('parameters')
      if (params) {
        for (const p of children(params)) {
          const pType = p.childForFieldName('type')
          if (pType) collectTypeIdentifiers(pType, paramTypes)
        }
      }

      const collectNew = (n: SyntaxNode) => {
        // new B()
        if (n.type === 'object_creation_expression') {
          const typeNode = n.childForFieldName('type')
          if (typeNode) collectTypeIdentifiers(typeNode, createTypes)
        }
        // B.staticMethod() or B.STATIC_FIELD
        if (n.type === 'method_invocation' || n.type === 'field_access') {
          const obj = n.childForFieldName('object')
          if (obj && (obj.type === 'type_identifier' || obj.type === 'identifier') && /^[A-Z]/.test(obj.text)) {
            createTypes.add(obj.text)
          }
        }
        for (const c of children(n)) collectNew(c)
      }
      const methodBody = member.childForFieldName('body')
      if (methodBody) collectNew(methodBody)
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
