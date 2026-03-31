import type { ParseResult } from './LanguageParser'
import type { ParserRegistry } from './ParserRegistry'
import { createParser } from './TreeSitterService'
import type { Language } from '../model/CodeElement'

export interface ParserEngineOptions {
  onProgress?: (parsed: number, total: number) => void
}

export class ParserEngine {
  private readonly registry: ParserRegistry

  constructor(registry: ParserRegistry) {
    this.registry = registry
  }

  async parseAll(files: File[], options: ParserEngineOptions = {}): Promise<ParseResult> {
    const supported = files.filter(f => this.registry.resolve(f.name) !== null)
    const result: ParseResult = { elements: [], relations: [] }

    for (let i = 0; i < supported.length; i++) {
      const file = supported[i]
      const languageParser = this.registry.resolve(file.name)!
      const source = await file.text()

      const parser = await createParser(languageParser.language as Language)
      const tree = parser.parse(source)
      if (!tree) continue

      const parsed = languageParser.parse(tree, source)
      result.elements.push(...parsed.elements)
      result.relations.push(...parsed.relations)

      options.onProgress?.(i + 1, supported.length)
    }

    return result
  }
}
