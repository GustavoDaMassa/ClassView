import type { LanguageParser } from './LanguageParser'

export class ParserRegistry {
  private readonly parsers = new Map<string, LanguageParser>()

  register(parser: LanguageParser): void {
    parser.extensions.forEach(ext => this.parsers.set(ext, parser))
  }

  resolve(filename: string): LanguageParser | null {
    const ext = filename.slice(filename.lastIndexOf('.'))
    return this.parsers.get(ext) ?? null
  }

  registeredExtensions(): string[] {
    return Array.from(this.parsers.keys())
  }
}
