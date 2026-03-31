import type { Tree } from './types'
import type { CodeElement, Language } from '../model/CodeElement'
import type { Relation } from '../model/Relation'

export interface ParseResult {
  elements: CodeElement[]
  relations: Relation[]
}

export interface LanguageParser {
  readonly language: Language
  readonly extensions: string[]
  parse(tree: Tree, source: string): ParseResult
}
