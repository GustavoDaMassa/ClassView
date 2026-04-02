import { ParserRegistry } from './ParserRegistry'
import { JavaParser } from './languages/JavaParser'
import { KotlinParser } from './languages/KotlinParser'
import { CSharpParser } from './languages/CSharpParser'
import { TypeScriptParser } from './languages/TypeScriptParser'
import { PythonParser } from './languages/PythonParser'
import { PhpParser } from './languages/PhpParser'
import { RubyParser } from './languages/RubyParser'

export function createRegistry(): ParserRegistry {
  const registry = new ParserRegistry()
  registry.register(new JavaParser())
  registry.register(new KotlinParser())
  registry.register(new CSharpParser())
  registry.register(new TypeScriptParser())
  registry.register(new PythonParser())
  registry.register(new PhpParser())
  registry.register(new RubyParser())
  return registry
}
