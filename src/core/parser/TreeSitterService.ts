import { Parser, Language } from 'web-tree-sitter'
import type { Language as AppLanguage } from '../model/CodeElement'

const IS_NODE = typeof window === 'undefined'

const FILE_NAMES: Record<AppLanguage, string> = {
  java: 'tree-sitter-java.wasm',
  kotlin: 'tree-sitter-kotlin.wasm',
  csharp: 'tree-sitter-c_sharp.wasm',
  typescript: 'tree-sitter-typescript.wasm',
  python: 'tree-sitter-python.wasm',
  php: 'tree-sitter-php.wasm',
  ruby: 'tree-sitter-ruby.wasm',
}

function getCoreWasmPath(): string {
  if (!IS_NODE) return '/tree-sitter.wasm'
  return new URL('../../../node_modules/web-tree-sitter/tree-sitter.wasm', import.meta.url).pathname
}

function getGrammarWasmPath(language: AppLanguage): string {
  if (!IS_NODE) return `/grammars/${FILE_NAMES[language]}`
  return new URL(
    `../../../node_modules/tree-sitter-wasms/out/${FILE_NAMES[language]}`,
    import.meta.url,
  ).pathname
}

const languageCache = new Map<AppLanguage, Language>()
let coreInitialized = false

async function initCore(): Promise<void> {
  if (coreInitialized) return
  await Parser.init({ locateFile: () => getCoreWasmPath() })
  coreInitialized = true
}

export async function loadLanguage(language: AppLanguage): Promise<Language> {
  const cached = languageCache.get(language)
  if (cached) return cached

  await initCore()
  const lang = await Language.load(getGrammarWasmPath(language))
  languageCache.set(language, lang)
  return lang
}

export async function createParser(language: AppLanguage): Promise<Parser> {
  const lang = await loadLanguage(language)
  const parser = new Parser()
  parser.setLanguage(lang)
  return parser
}
