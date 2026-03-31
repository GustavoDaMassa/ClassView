export type { Parser, Node as SyntaxNode, Tree } from 'web-tree-sitter'

import type { Node as SyntaxNode } from 'web-tree-sitter'

export function children(node: SyntaxNode): SyntaxNode[] {
  return node.children.filter((c): c is SyntaxNode => c !== null)
}
