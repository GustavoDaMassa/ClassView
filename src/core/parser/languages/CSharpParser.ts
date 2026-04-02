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

function getModifiers(node: SyntaxNode): string[] {
  return children(node).filter(c => c.type === 'modifier').map(c => c.text)
}

function getVisibility(modifiers: string[]): Attribute['visibility'] {
  for (const mod of modifiers) {
    if (mod in VISIBILITY_MAP) return VISIBILITY_MAP[mod]
  }
  return '~'
}

function getElementType(node: SyntaxNode, modifiers: string[]): ElementType {
  switch (node.type) {
    case 'interface_declaration': return 'interface'
    case 'enum_declaration': return 'enum'
    case 'record_declaration': return 'record'
    case 'struct_declaration': return 'struct'
    case 'class_declaration':
      if (modifiers.includes('abstract')) return 'abstract'
      if (modifiers.includes('sealed')) return 'sealed'
      return 'class'
    default: return 'class'
  }
}

function extractAttributes(bodyNode: SyntaxNode | null): Attribute[] {
  if (!bodyNode) return []
  const attrs: Attribute[] = []

  for (const child of children(bodyNode)) {
    if (child.type === 'field_declaration') {
      const mods = getModifiers(child)
      const visibility = getVisibility(mods)
      const varDecl = children(child).find(c => c.type === 'variable_declaration')
      if (!varDecl) continue

      const typeNode = children(varDecl).find(c =>
        c.type === 'predefined_type' || c.type === 'identifier' || c.type === 'nullable_type' || c.type === 'generic_name',
      )
      const nameNode = children(varDecl).find(c => c.type === 'variable_declarator')

      if (typeNode && nameNode) {
        attrs.push({ visibility, name: nameNode.text, type: typeNode.text })
      }
    }

    if (child.type === 'property_declaration') {
      const mods = getModifiers(child)
      const visibility = getVisibility(mods)
      const typeNode = children(child).find(c =>
        c.type === 'predefined_type' || c.type === 'identifier' || c.type === 'generic_name',
      )
      const nameNode = children(child).find(c => c.type === 'identifier' && c !== typeNode)

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
      const nameNode = children(child).find(c => c.type === 'identifier')
      const paramsNode = children(child).find(c => c.type === 'parameter_list')
      const returnTypeNode = children(child).find(c =>
        c.type === 'predefined_type' || c.type === 'identifier' || c.type === 'void_keyword',
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

// Heuristic: C# interfaces conventionally start with 'I' followed by uppercase
function isInterface(name: string): boolean {
  return name.length > 1 && name[0] === 'I' && name[1] === name[1].toUpperCase() && name[1] !== name[1].toLowerCase()
}


function extractRelations(node: SyntaxNode, className: string): Relation[] {
  const relations: Relation[] = []

  const baseList = children(node).find(c => c.type === 'base_list')
  if (baseList) {
    for (const child of children(baseList)) {
      if (child.type === 'identifier') {
        relations.push({
          source: className,
          target: child.text,
          type: isInterface(child.text) ? 'implements' : 'extends',
        })
      }
    }
  }

  const body = children(node).find(c => c.type === 'declaration_list') ?? null
  if (!body) return relations

  const fieldTypes = new Set<string>()
  const paramTypes = new Set<string>()
  const returnTypes = new Set<string>()
  const createTypes = new Set<string>()

  for (const member of children(body)) {
    if (member.type === 'field_declaration') {
      const varDecl = children(member).find(c => c.type === 'variable_declaration')
      const typeNode = (varDecl ? children(varDecl) : []).find(c => c.type === 'identifier' || c.type === 'generic_name')
      if (typeNode) fieldTypes.add(typeNode.text.split('<')[0])
    }

    if (member.type === 'method_declaration' || member.type === 'constructor_declaration') {
      const retType = children(member).find(c => c.type === 'identifier' || c.type === 'generic_name')
      if (retType) returnTypes.add(retType.text.split('<')[0])

      const params = children(member).find(c => c.type === 'parameter_list')
      if (params) {
        for (const p of children(params)) {
          const pType = children(p).find(c => c.type === 'identifier' || c.type === 'generic_name')
          if (pType) paramTypes.add(pType.text.split('<')[0])
        }
      }

      const collectNew = (n: SyntaxNode) => {
        if (n.type === 'object_creation_expression') {
          const typeNode = children(n).find(c => c.type === 'identifier' || c.type === 'generic_name')
          if (typeNode) createTypes.add(typeNode.text.split('<')[0])
        }
        for (const c of children(n)) collectNew(c)
      }
      const mBody = children(member).find(c => c.type === 'block')
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
  'interface_declaration',
  'enum_declaration',
  'record_declaration',
  'struct_declaration',
])

export class CSharpParser implements LanguageParser {
  readonly language: Language = 'csharp'
  readonly extensions = ['.cs']

  parse(tree: Tree, _source: string): ParseResult {
    const elements: CodeElement[] = []
    const relations: Relation[] = []

    const visit = (node: SyntaxNode) => {
      if (CLASS_NODES.has(node.type)) {
        const nameNode = children(node).find(c => c.type === 'identifier')
        if (!nameNode) return

        const name = nameNode.text
        const modifiers = getModifiers(node)
        const type = getElementType(node, modifiers)
        const body = children(node).find(c => c.type === 'declaration_list') ?? null

        elements.push({
          id: name,
          name,
          type,
          language: 'csharp',
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
