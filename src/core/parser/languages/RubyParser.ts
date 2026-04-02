import type { SyntaxNode, Tree } from '../types'
import { children } from '../types'
import type { LanguageParser, ParseResult } from '../LanguageParser'
import type { CodeElement, Method, ElementType, Language } from '../../model/CodeElement'
import type { Relation } from '../../model/Relation'

function extractMethods(bodyNode: SyntaxNode | null): Method[] {
  if (!bodyNode) return []
  const methods: Method[] = []

  for (const child of children(bodyNode)) {
    if (child.type === 'method') {
      const nameNode = children(child).find(c => c.type === 'identifier')
      if (!nameNode || nameNode.text === 'initialize') continue

      const paramsNode = children(child).find(c => c.type === 'method_parameters')

      methods.push({
        visibility: '+',
        name: nameNode.text,
        returnType: '',
        params: paramsNode?.text ?? '()',
      })
    }
  }

  return methods
}

function extractRelations(node: SyntaxNode, className: string): Relation[] {
  const relations: Relation[] = []

  const superclass = children(node).find(c => c.type === 'superclass')
  if (superclass) {
    const target = children(superclass).find(c => c.type === 'constant')?.text
    if (target) relations.push({ source: className, target, type: 'extends' })
  }

  const body = children(node).find(c => c.type === 'body_statement') ?? null
  if (!body) return relations

  const createTypes = new Set<string>()

  for (const member of children(body)) {
    if (member.type === 'call') {
      const methodId = children(member).find(c => c.type === 'identifier')
      if (methodId?.text === 'include' || methodId?.text === 'prepend') {
        const arg = children(member).find(c => c.type === 'argument_list')
        const constant = (arg ? children(arg) : []).find(c => c.type === 'constant')
        if (constant) relations.push({ source: className, target: constant.text, type: 'implements' })
      }
    }

    if (member.type === 'method') {
      const collectNew = (n: SyntaxNode) => {
        if (n.type === 'call' && children(n).some(c => c.type === 'identifier' && c.text === 'new')) {
          const recv = children(n).find(c => c.type === 'constant')
          if (recv) createTypes.add(recv.text)
        }
        for (const c of children(n)) collectNew(c)
      }
      collectNew(member)
    }
  }

  for (const target of createTypes) {
    if (target !== className) relations.push({ source: className, target, type: 'creates' })
  }

  return relations
}

export class RubyParser implements LanguageParser {
  readonly language: Language = 'ruby'
  readonly extensions = ['.rb']

  parse(tree: Tree, _source: string): ParseResult {
    const elements: CodeElement[] = []
    const relations: Relation[] = []

    const visit = (node: SyntaxNode) => {
      if (node.type === 'class' || node.type === 'module') {
        const nameNode = children(node).find(c => c.type === 'constant')
        if (!nameNode) return

        const name = nameNode.text
        const type: ElementType = node.type === 'module' ? 'trait' : 'class'
        const body = children(node).find(c => c.type === 'body_statement') ?? null

        elements.push({
          id: name,
          name,
          type,
          language: 'ruby',
          attributes: [],
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
