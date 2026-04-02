# ClassView — Mapa de Classes

<details id="dir-root">
<summary><strong>ClassView/ (raiz)</strong></summary>
<blockquote>

- [index.html](index.html) — entry point HTML; monta `<div id="root">` e carrega `src/main.tsx`
- [package.json](package.json) — dependências: React 19, @xyflow/react, roughjs, web-tree-sitter, tree-sitter-wasms; scripts: dev, build, test, coverage
- [vite.config.ts](vite.config.ts) — configura Vitest (environment: happy-dom, globals, coverage v8) e plugin React
- [tsconfig.json](tsconfig.json) — tsconfig raiz (references para app e node)
- [tsconfig.app.json](tsconfig.app.json) — configuração TypeScript para o código da aplicação
- [tsconfig.node.json](tsconfig.node.json) — configuração TypeScript para ferramentas Node (vite.config.ts)
- [eslint.config.js](eslint.config.js) — regras ESLint com typescript-eslint, react-hooks e react-refresh
- [requisitos.md](requisitos.md) — documento de requisitos do projeto
- [arquitetura.md](arquitetura.md) — documento de arquitetura do projeto
- [README.md](README.md) — documentação pública

</blockquote>
</details>

---

<details id="dir-public">
<summary><strong>public/</strong></summary>
<blockquote>

- [public/favicon.svg](public/favicon.svg) — ícone da aplicação
- [public/tree-sitter.wasm](public/tree-sitter.wasm) — runtime WebAssembly do web-tree-sitter (core)

<details id="dir-public-grammars">
<summary><strong>grammars/</strong></summary>
<blockquote>

- [grammars/tree-sitter-java.wasm](public/grammars/tree-sitter-java.wasm) — gramática Tree-sitter para Java
- [grammars/tree-sitter-kotlin.wasm](public/grammars/tree-sitter-kotlin.wasm) — gramática Tree-sitter para Kotlin
- [grammars/tree-sitter-c_sharp.wasm](public/grammars/tree-sitter-c_sharp.wasm) — gramática Tree-sitter para C#
- [grammars/tree-sitter-typescript.wasm](public/grammars/tree-sitter-typescript.wasm) — gramática Tree-sitter para TypeScript
- [grammars/tree-sitter-tsx.wasm](public/grammars/tree-sitter-tsx.wasm) — gramática Tree-sitter para TSX
- [grammars/tree-sitter-python.wasm](public/grammars/tree-sitter-python.wasm) — gramática Tree-sitter para Python
- [grammars/tree-sitter-php.wasm](public/grammars/tree-sitter-php.wasm) — gramática Tree-sitter para PHP
- [grammars/tree-sitter-ruby.wasm](public/grammars/tree-sitter-ruby.wasm) — gramática Tree-sitter para Ruby

</blockquote>
</details>

</blockquote>
</details>

---

## src/

<details id="dir-src">
<summary><strong>src/</strong></summary>
<blockquote>

<details id="main-tsx">
<summary><strong><a href="src/main.tsx">main.tsx</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `react` — StrictMode
- `react-dom/client` — createRoot
- `./App` — componente raiz
- `./index.css`

</details>

<details><summary>funcao</summary>

Ponto de entrada da aplicação: monta `<App />` em `#root` com `StrictMode`.

</details>

</blockquote>
</details>

---

<details id="app-tsx">
<summary><strong><a href="src/App.tsx">App.tsx</a> [default export]</strong></summary>
<blockquote>

<details><summary>tipos</summary>

- `type AppState = 'import' | 'graph'` — estado global da navegação
- `interface GraphData` — `{ nodes: ElementNode[], edges: Edge[], isolated: CodeElement[] }`

</details>

<details><summary>dependencias</summary>

- `react` — useState, useCallback
- `./features/importer/Importer` — [Importer](#importer-tsx)
- `./features/graph/GraphView` — [GraphView](#graphview-tsx)
- `./features/graph/FilterToolbar` — [FilterToolbar](#filtertoolbar-tsx), [RelationFilter](#filtertoolbar-tsx)
- `./core/graph/GraphBuilder` — [buildGraph](#graphbuilder-ts), [ElementNode](#graphbuilder-ts)
- `./core/parser/ParserEngine` — [ParserEngine](#parserengine-ts)
- `./core/parser/createRegistry` — [createRegistry](#createregistry-ts)
- `./core/model/CodeElement` — [CodeElement](#codeelement-ts)
- `@xyflow/react` — Edge

</details>

<details><summary>exporta</summary>

- `export default function App()` — componente raiz; alterna entre tela `import` e tela `graph`; cria `ParserEngine` com `createRegistry()` no module scope

</details>

<details><summary>estado</summary>

- `state: AppState` — tela atual
- `loading: boolean`, `progress: number`, `total: number` — progresso do parsing
- `graphData: GraphData | null` — resultado do grafo
- `filters: RelationFilter` — filtros de relação ativos

</details>

</blockquote>
</details>

- [src/index.css](src/index.css) — estilos globais da aplicação (variáveis CSS, tema dark/light)

</blockquote>
</details>

---

## src/core/

<details id="dir-core-model">
<summary><strong>src/core/model/</strong></summary>
<blockquote>

<details id="codeelement-ts">
<summary><strong><a href="src/core/model/CodeElement.ts">CodeElement.ts</a></strong></summary>
<blockquote>

<details><summary>tipos</summary>

- `type ElementType = 'class' | 'abstract' | 'interface' | 'enum' | 'record' | 'sealed' | 'struct' | 'object' | 'trait' | 'dataclass'`
- `type Language = 'java' | 'kotlin' | 'csharp' | 'typescript' | 'python' | 'php' | 'ruby'`

</details>

<details><summary>interfaces</summary>

- `interface Attribute` — `{ visibility: '+' | '-' | '#' | '~', name: string, type: string }`
- `interface Method` — `{ visibility: '+' | '-' | '#' | '~', name: string, params: string, returnType: string }`
- `interface CodeElement` — `{ id, name, type: ElementType, language: Language, attributes: Attribute[], methods: Method[], filePath: string }`

</details>

<details><summary>exporta</summary>

Todos os tipos e interfaces acima.

</details>

</blockquote>
</details>

<details id="relation-ts">
<summary><strong><a href="src/core/model/Relation.ts">Relation.ts</a></strong></summary>
<blockquote>

<details><summary>tipos</summary>

- `type RelationType = 'extends' | 'implements' | 'field' | 'parameter' | 'returns' | 'creates'`

</details>

<details><summary>interfaces</summary>

- `interface Relation` — `{ source: string, target: string, type: RelationType }`

</details>

<details><summary>exporta</summary>

`RelationType` e `Relation`.

</details>

</blockquote>
</details>

</blockquote>
</details>

---

<details id="dir-core-parser">
<summary><strong>src/core/parser/</strong></summary>
<blockquote>

<details id="types-ts">
<summary><strong><a href="src/core/parser/types.ts">types.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `web-tree-sitter` — Parser, Node (re-exportado como SyntaxNode), Tree

</details>

<details><summary>exporta</summary>

- Re-exporta `Parser`, `Node as SyntaxNode`, `Tree` de `web-tree-sitter`
- `function children(node: SyntaxNode): SyntaxNode[]` — helper que filtra filhos não-nulos de um nó da AST

</details>

</blockquote>
</details>

<details id="languageparser-ts">
<summary><strong><a href="src/core/parser/LanguageParser.ts">LanguageParser.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `./types` — [Tree](#types-ts)
- `../model/CodeElement` — [CodeElement](#codeelement-ts), [Language](#codeelement-ts)
- `../model/Relation` — [Relation](#relation-ts)

</details>

<details><summary>interfaces</summary>

- `interface ParseResult` — `{ elements: CodeElement[], relations: Relation[] }`
- `interface LanguageParser` — contrato de parser de linguagem: `language: Language`, `extensions: string[]`, `parse(tree: Tree, source: string): ParseResult`

</details>

<details><summary>exporta</summary>

`ParseResult` e `LanguageParser`.

</details>

</blockquote>
</details>

<details id="parserregistry-ts">
<summary><strong><a href="src/core/parser/ParserRegistry.ts">ParserRegistry.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `./LanguageParser` — [LanguageParser](#languageparser-ts)

</details>

<details><summary>class</summary>

**`ParserRegistry`** — registro de parsers indexado por extensão de arquivo

- `private parsers: Map<string, LanguageParser>` — mapa de extensão → parser
- `register(parser: LanguageParser): void` — registra todas as extensões do parser
- `resolve(filename: string): LanguageParser | null` — resolve parser pela extensão do arquivo
- `registeredExtensions(): string[]` — lista todas as extensões registradas

</details>

<details><summary>exporta</summary>

`ParserRegistry`

</details>

</blockquote>
</details>

<details id="parserengine-ts">
<summary><strong><a href="src/core/parser/ParserEngine.ts">ParserEngine.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `./LanguageParser` — [ParseResult](#languageparser-ts)
- `./ParserRegistry` — [ParserRegistry](#parserregistry-ts)
- `./TreeSitterService` — [createParser](#treesitterservice-ts)
- `../model/CodeElement` — [Language](#codeelement-ts)

</details>

<details><summary>interfaces</summary>

- `interface ParserEngineOptions` — `{ onProgress?: (parsed: number, total: number) => void }`

</details>

<details><summary>class</summary>

**`ParserEngine`** — orquestra o parsing de múltiplos arquivos

- `private registry: ParserRegistry`
- `constructor(registry: ParserRegistry)`
- `async parseAll(files: File[], options?: ParserEngineOptions): Promise<ParseResult>` — filtra arquivos suportados, parseia cada um via Tree-sitter e acumula elementos e relações; chama `onProgress` a cada arquivo processado

</details>

<details><summary>exporta</summary>

`ParserEngineOptions`, `ParserEngine`

</details>

</blockquote>
</details>

<details id="treesitterservice-ts">
<summary><strong><a href="src/core/parser/TreeSitterService.ts">TreeSitterService.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `web-tree-sitter` — Parser, Language
- `../model/CodeElement` — [Language as AppLanguage](#codeelement-ts)

</details>

<details><summary>funcoes</summary>

- `async function loadLanguage(language: AppLanguage): Promise<Language>` — inicializa o core wasm (singleton) e carrega a gramática da linguagem (cache interno via `languageCache`)
- `export async function createParser(language: AppLanguage): Promise<Parser>` — cria e configura um parser Tree-sitter para a linguagem; usa `loadLanguage`

</details>

<details><summary>internos</summary>

- `FILE_NAMES: Record<AppLanguage, string>` — mapa linguagem → nome do arquivo `.wasm`
- `languageCache: Map<AppLanguage, Language>` — cache de gramáticas carregadas
- `coreInitialized: boolean` — flag de inicialização única do core wasm
- `getCoreWasmPath()`, `getGrammarWasmPath()` — resolução de caminhos para browser e Node

</details>

<details><summary>exporta</summary>

`loadLanguage`, `createParser`

</details>

</blockquote>
</details>

<details id="createregistry-ts">
<summary><strong><a href="src/core/parser/createRegistry.ts">createRegistry.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `./ParserRegistry` — [ParserRegistry](#parserregistry-ts)
- `./languages/JavaParser` — [JavaParser](#javaparser-ts)
- `./languages/KotlinParser` — [KotlinParser](#kotlinparser-ts)
- `./languages/CSharpParser` — [CSharpParser](#csharpparser-ts)
- `./languages/TypeScriptParser` — [TypeScriptParser](#typescriptparser-ts)
- `./languages/PythonParser` — [PythonParser](#pythonparser-ts)
- `./languages/PhpParser` — [PhpParser](#phpparser-ts)
- `./languages/RubyParser` — [RubyParser](#rubyparser-ts)

</details>

<details><summary>funcao</summary>

- `export function createRegistry(): ParserRegistry` — factory que instancia e registra todos os parsers de linguagem suportados

</details>

</blockquote>
</details>

---

<details id="dir-core-parser-languages">
<summary><strong>languages/</strong></summary>
<blockquote>

<details id="javaparser-ts">
<summary><strong><a href="src/core/parser/languages/JavaParser.ts">JavaParser.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `../types` — [SyntaxNode](#types-ts), [Tree](#types-ts), [children](#types-ts)
- `../LanguageParser` — [LanguageParser](#languageparser-ts), [ParseResult](#languageparser-ts)
- `../../model/CodeElement` — [CodeElement](#codeelement-ts), Attribute, Method, ElementType, Language
- `../../model/Relation` — [Relation](#relation-ts)

</details>

<details><summary>class</summary>

**`JavaParser`** implements [LanguageParser](#languageparser-ts)

- `readonly language: Language = 'java'`
- `readonly extensions = ['.java']`
- `parse(tree: Tree, _source: string): ParseResult` — visita recursiva da AST; reconhece `class_declaration`, `interface_declaration`, `enum_declaration`, `record_declaration`; detecta `abstract` e `sealed` por modificadores

</details>

<details><summary>internos</summary>

- `getVisibility(modifiers)`, `getModifiers(node)`, `getElementType(node, modifiers)`, `extractName(node)`, `extractAttributes(bodyNode)`, `extractMethods(bodyNode)` — extração de membros
- `collectTypeIdentifiers(node, out)` — coleta recursiva de `type_identifier`
- `extractRelations(node, className)` — detecta extends, implements, field, parameter, returns, creates

</details>

<details><summary>exporta</summary>

`JavaParser`

</details>

</blockquote>
</details>

<details id="kotlinparser-ts">
<summary><strong><a href="src/core/parser/languages/KotlinParser.ts">KotlinParser.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `../types` — [SyntaxNode](#types-ts), [Tree](#types-ts), [children](#types-ts)
- `../LanguageParser` — [LanguageParser](#languageparser-ts), [ParseResult](#languageparser-ts)
- `../../model/CodeElement` — [CodeElement](#codeelement-ts), Attribute, Method, ElementType, Language
- `../../model/Relation` — [Relation](#relation-ts)

</details>

<details><summary>class</summary>

**`KotlinParser`** implements [LanguageParser](#languageparser-ts)

- `readonly language: Language = 'kotlin'`
- `readonly extensions = ['.kt']`
- `parse(tree: Tree, _source: string): ParseResult` — reconhece `class_declaration` e `object_declaration`; `data class` → `record`, `sealed` → `sealed`, `object` → `object`

</details>

<details><summary>internos</summary>

- `getVisibility(modifiersNode)`, `getElementType(node)`, `extractAttributes(bodyNode)`, `extractMethods(bodyNode)` — extração via `property_declaration` e `function_declaration`
- `collectUserTypes(node, out)` — coleta `user_type` sem recursão em genéricos
- `extractRelations(node, className)` — detecta herança via `delegation_specifier`; distingue extends (com `constructor_invocation`) de implements

</details>

<details><summary>exporta</summary>

`KotlinParser`

</details>

</blockquote>
</details>

<details id="csharpparser-ts">
<summary><strong><a href="src/core/parser/languages/CSharpParser.ts">CSharpParser.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `../types` — [SyntaxNode](#types-ts), [Tree](#types-ts), [children](#types-ts)
- `../LanguageParser` — [LanguageParser](#languageparser-ts), [ParseResult](#languageparser-ts)
- `../../model/CodeElement` — [CodeElement](#codeelement-ts), Attribute, Method, ElementType, Language
- `../../model/Relation` — [Relation](#relation-ts)

</details>

<details><summary>class</summary>

**`CSharpParser`** implements [LanguageParser](#languageparser-ts)

- `readonly language: Language = 'csharp'`
- `readonly extensions = ['.cs']`
- `parse(tree: Tree, _source: string): ParseResult` — reconhece class, interface, enum, record, struct; detecta abstract e sealed por modificadores

</details>

<details><summary>internos</summary>

- `getModifiers(node)`, `getVisibility(modifiers)`, `getElementType(node, modifiers)`, `extractAttributes(bodyNode)`, `extractMethods(bodyNode)` — extração via `field_declaration` e `property_declaration`
- `isInterface(name): boolean` — heurística: nome começa com `I` maiúsculo seguido de maiúscula
- `extractRelations(node, className)` — lê `base_list`; usa `isInterface` para distinguir extends de implements

</details>

<details><summary>exporta</summary>

`CSharpParser`

</details>

</blockquote>
</details>

<details id="typescriptparser-ts">
<summary><strong><a href="src/core/parser/languages/TypeScriptParser.ts">TypeScriptParser.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `../types` — [SyntaxNode](#types-ts), [Tree](#types-ts), [children](#types-ts)
- `../LanguageParser` — [LanguageParser](#languageparser-ts), [ParseResult](#languageparser-ts)
- `../../model/CodeElement` — [CodeElement](#codeelement-ts), Attribute, Method, ElementType, Language
- `../../model/Relation` — [Relation](#relation-ts)

</details>

<details><summary>class</summary>

**`TypeScriptParser`** implements [LanguageParser](#languageparser-ts)

- `readonly language: Language = 'typescript'`
- `readonly extensions = ['.ts', '.tsx']`
- `parse(tree: Tree, _source: string): ParseResult` — reconhece `class_declaration`, `abstract_class_declaration`, `interface_declaration`, `enum_declaration`

</details>

<details><summary>internos</summary>

- `getVisibility(accessibilityNode)`, `getElementType(node)`, `extractAttributes(bodyNode)`, `extractMethods(bodyNode)` — extração via `public_field_definition` e `method_definition`
- `collectTypeRefs(node, out)` — coleta `type_identifier`
- `extractRelations(node, className)` — lê `class_heritage` com `extends_clause` e `implements_clause`

</details>

<details><summary>exporta</summary>

`TypeScriptParser`

</details>

</blockquote>
</details>

<details id="pythonparser-ts">
<summary><strong><a href="src/core/parser/languages/PythonParser.ts">PythonParser.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `../types` — [SyntaxNode](#types-ts), [Tree](#types-ts), [children](#types-ts)
- `../LanguageParser` — [LanguageParser](#languageparser-ts), [ParseResult](#languageparser-ts)
- `../../model/CodeElement` — [CodeElement](#codeelement-ts), Attribute, Method, ElementType, Language
- `../../model/Relation` — [Relation](#relation-ts)

</details>

<details><summary>class</summary>

**`PythonParser`** implements [LanguageParser](#languageparser-ts)

- `readonly language: Language = 'python'`
- `readonly extensions = ['.py']`
- `parse(tree: Tree, _source: string): ParseResult` — reconhece `class_definition`; detecta `@dataclass` via `hasDecorator`

</details>

<details><summary>internos</summary>

- `hasDecorator(node, name)` — verifica decorators no nó pai `decorated_definition`
- `getElementType(node)` — `@dataclass` → `dataclass`, senão `class`
- `extractAttributes(bodyNode)` — apenas atributos com anotação de tipo (`name: type`)
- `extractMethods(bodyNode)` — ignora dunders (`__init__`, etc.)
- `extractRelations(node, className)` — herança via `argument_list`; instanciação via `call` começando com maiúscula

</details>

<details><summary>exporta</summary>

`PythonParser`

</details>

</blockquote>
</details>

<details id="phpparser-ts">
<summary><strong><a href="src/core/parser/languages/PhpParser.ts">PhpParser.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `../types` — [SyntaxNode](#types-ts), [Tree](#types-ts), [children](#types-ts)
- `../LanguageParser` — [LanguageParser](#languageparser-ts), [ParseResult](#languageparser-ts)
- `../../model/CodeElement` — [CodeElement](#codeelement-ts), Attribute, Method, ElementType, Language
- `../../model/Relation` — [Relation](#relation-ts)

</details>

<details><summary>class</summary>

**`PhpParser`** implements [LanguageParser](#languageparser-ts)

- `readonly language: Language = 'php'`
- `readonly extensions = ['.php']`
- `parse(tree: Tree, _source: string): ParseResult` — reconhece `class_declaration`, `interface_declaration`, `enum_declaration`, `trait_declaration`

</details>

<details><summary>internos</summary>

- `getVisibility(node)`, `getElementType(node)`, `extractAttributes(bodyNode)`, `extractMethods(bodyNode)` — extração via `property_declaration` e `method_declaration`
- `extractRelations(node, className)` — lê `base_clause`, `class_interface_clause`; detecta `use_declaration` (traits) como `implements`

</details>

<details><summary>exporta</summary>

`PhpParser`

</details>

</blockquote>
</details>

<details id="rubyparser-ts">
<summary><strong><a href="src/core/parser/languages/RubyParser.ts">RubyParser.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `../types` — [SyntaxNode](#types-ts), [Tree](#types-ts), [children](#types-ts)
- `../LanguageParser` — [LanguageParser](#languageparser-ts), [ParseResult](#languageparser-ts)
- `../../model/CodeElement` — [CodeElement](#codeelement-ts), Method, ElementType, Language
- `../../model/Relation` — [Relation](#relation-ts)

</details>

<details><summary>class</summary>

**`RubyParser`** implements [LanguageParser](#languageparser-ts)

- `readonly language: Language = 'ruby'`
- `readonly extensions = ['.rb']`
- `parse(tree: Tree, _source: string): ParseResult` — reconhece `class` (→ `class`) e `module` (→ `trait`); sem atributos (Ruby não tem tipagem estática)

</details>

<details><summary>internos</summary>

- `extractMethods(bodyNode)` — ignora `initialize`
- `extractRelations(node, className)` — herança via `superclass`; `include`/`prepend` → `implements`; instanciação via `Class.new` → `creates`

</details>

<details><summary>exporta</summary>

`RubyParser`

</details>

</blockquote>
</details>

</blockquote>
</details>

---

<details id="dir-core-parser-tests">
<summary><strong>src/core/parser/__tests__/</strong></summary>
<blockquote>

<details id="javaparser-test-ts">
<summary><strong><a href="src/core/parser/__tests__/JavaParser.test.ts">JavaParser.test.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `vitest` — describe, it, expect, beforeAll
- `../TreeSitterService` — [createParser](#treesitterservice-ts)
- `../languages/JavaParser` — [JavaParser](#javaparser-ts)

</details>

<details><summary>cobertura</summary>

- Tipos de elemento: class, abstract, interface, enum, record, sealed
- Atributos: visibilidades +, -, #
- Métodos: extração e parâmetros
- Relações: extends, implements (múltiplas), extends+implements, field-type dependency
- Múltiplas classes em um arquivo

</details>

</blockquote>
</details>

<details id="kotlinparser-test-ts">
<summary><strong><a href="src/core/parser/__tests__/KotlinParser.test.ts">KotlinParser.test.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `vitest` — describe, it, expect, beforeAll
- `../TreeSitterService` — [createParser](#treesitterservice-ts)
- `../languages/KotlinParser` — [KotlinParser](#kotlinparser-ts)

</details>

<details><summary>cobertura</summary>

- Tipos: class, abstract, interface, enum, data class (record), sealed, object
- Atributos: val, var, visibilidade private
- Métodos: fun com retorno
- Relações: supertype (extends), interface (implements), property-type dependency (field)

</details>

</blockquote>
</details>

<details id="csharpparser-test-ts">
<summary><strong><a href="src/core/parser/__tests__/CSharpParser.test.ts">CSharpParser.test.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `vitest` — describe, it, expect, beforeAll
- `../TreeSitterService` — [createParser](#treesitterservice-ts)
- `../languages/CSharpParser` — [CSharpParser](#csharpparser-ts)

</details>

<details><summary>cobertura</summary>

- Tipos: class, abstract, interface, enum, record, sealed, struct
- Atributos: field privado, property pública
- Métodos: visibilidades, parâmetros
- Relações: extends (sem prefixo I), implements (prefixo I), extends+implements, field dependency

</details>

</blockquote>
</details>

<details id="typescriptparser-test-ts">
<summary><strong><a href="src/core/parser/__tests__/TypeScriptParser.test.ts">TypeScriptParser.test.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `vitest` — describe, it, expect, beforeAll
- `../TreeSitterService` — [createParser](#treesitterservice-ts)
- `../languages/TypeScriptParser` — [TypeScriptParser](#typescriptparser-ts)

</details>

<details><summary>cobertura</summary>

- Tipos: class, abstract, interface, enum
- Atributos: visibilidades +, -, ~ (sem modificador)
- Métodos: retorno tipado, parâmetros
- Relações: extends, implements, extends+implements, field dependency

</details>

</blockquote>
</details>

<details id="pythonparser-test-ts">
<summary><strong><a href="src/core/parser/__tests__/PythonParser.test.ts">PythonParser.test.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `vitest` — describe, it, expect, beforeAll
- `../TreeSitterService` — [createParser](#treesitterservice-ts)
- `../languages/PythonParser` — [PythonParser](#pythonparser-ts)

</details>

<details><summary>cobertura</summary>

- Tipos: class, dataclass
- Atributos tipados; visibilidade sempre `+`
- Métodos: retorno anotado; dunders ignorados
- Relações: herança simples e múltipla (extends), parâmetro tipado no `__init__` (parameter)

</details>

</blockquote>
</details>

<details id="phpparser-test-ts">
<summary><strong><a href="src/core/parser/__tests__/PhpParser.test.ts">PhpParser.test.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `vitest` — describe, it, expect, beforeAll
- `../TreeSitterService` — [createParser](#treesitterservice-ts)
- `../languages/PhpParser` — [PhpParser](#phpparser-ts)

</details>

<details><summary>cobertura</summary>

- Tipos: class, abstract, interface, enum, trait
- Atributos: property privada com tipo
- Métodos: visibilidade e retorno
- Relações: extends, implements, extends+implements

</details>

</blockquote>
</details>

<details id="rubyparser-test-ts">
<summary><strong><a href="src/core/parser/__tests__/RubyParser.test.ts">RubyParser.test.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `vitest` — describe, it, expect, beforeAll
- `../TreeSitterService` — [createParser](#treesitterservice-ts)
- `../languages/RubyParser` — [RubyParser](#rubyparser-ts)

</details>

<details><summary>cobertura</summary>

- Tipos: class, module (→ trait)
- Métodos: extração; `initialize` ignorado
- Relações: herança `< Animal` (extends)

</details>

</blockquote>
</details>

</blockquote>
</details>

---

<details id="dir-core-graph">
<summary><strong>src/core/graph/</strong></summary>
<blockquote>

<details id="graphbuilder-ts">
<summary><strong><a href="src/core/graph/GraphBuilder.ts">GraphBuilder.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `@xyflow/react` — Node, Edge
- `../model/CodeElement` — [CodeElement](#codeelement-ts)
- `../model/Relation` — [Relation](#relation-ts)

</details>

<details><summary>tipos</summary>

- `interface ElementNodeData extends Record<string, unknown>` — `{ element: CodeElement }`
- `type ElementNode = Node<ElementNodeData>`

</details>

<details><summary>funcoes</summary>

- `export function buildGraph(elements: CodeElement[], relations: Relation[]): { nodes: ElementNode[], edges: Edge[], isolated: CodeElement[] }` — constrói nós (um por elemento), arestas (apenas entre elementos existentes no grafo), e lista de isolados (sem nenhuma aresta)

</details>

<details><summary>exporta</summary>

`ElementNodeData`, `ElementNode`, `buildGraph`

</details>

</blockquote>
</details>

<details id="layoutengine-ts">
<summary><strong><a href="src/core/graph/layoutEngine.ts">layoutEngine.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `@xyflow/react` — Node, Edge

</details>

<details><summary>tipos internos</summary>

- `interface Vec2` — `{ x, y, vx, vy }` — estado de posição e velocidade para simulação de forças

</details>

<details><summary>funcoes</summary>

- `export function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[]` — simulação de forças (force-directed): repulsão entre todos os pares, atração de mola para arestas, gravidade ao centro, amortecimento por iteração; pós-simulação resolve sobreposições; retorna nós com `position` atualizado

</details>

<details><summary>constantes</summary>

`NODE_WIDTH = 200`, `NODE_HEIGHT = 80`, `REPULSION = 90000`, `SPRING_LENGTH = 620`, `SPRING_K = 0.025`, `GRAVITY = 0.005`, `DAMPING = 0.82`, `ITERATIONS = 500`

</details>

<details><summary>exporta</summary>

`applyDagreLayout`

</details>

</blockquote>
</details>

<details id="dir-core-graph-tests">
<summary><strong>__tests__/</strong></summary>
<blockquote>

<details id="graphbuilder-test-ts">
<summary><strong><a href="src/core/graph/__tests__/GraphBuilder.test.ts">GraphBuilder.test.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `vitest` — describe, it, expect
- `../GraphBuilder` — [buildGraph](#graphbuilder-ts)
- `../../model/CodeElement` — [CodeElement](#codeelement-ts)
- `../../model/Relation` — [Relation](#relation-ts)

</details>

<details><summary>cobertura</summary>

- Nodes: um nó por elemento, mapeamento de id, dados em `node.data`, tipo do nó = tipo do elemento (todos os 10 tipos)
- Edges: uma aresta por relação, source/target, tipo da aresta = tipo da relação
- Filtragem: aresta com target inexistente é ignorada
- Isolated: elementos sem arestas marcados como isolados; todos conectados → lista vazia

</details>

</blockquote>
</details>

</blockquote>
</details>

</blockquote>
</details>

---

## src/features/

<details id="dir-features-graph">
<summary><strong>src/features/graph/</strong></summary>
<blockquote>

<details id="graphview-tsx">
<summary><strong><a href="src/features/graph/GraphView.tsx">GraphView.tsx</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `react` — useCallback, useMemo
- `@xyflow/react` — ReactFlow, Background, Controls, useNodesState, useEdgesState, ReactFlowProvider, Position, Edge, NodeMouseHandler
- `../../core/model/CodeElement` — [CodeElement](#codeelement-ts)
- `../../core/model/Relation` — [RelationType](#relation-ts)
- `../../core/graph/layoutEngine` — [applyDagreLayout](#layoutengine-ts)
- `./nodes` — [nodeTypes](#nodes-index-tsx)
- `./edges` — [edgeTypes](#edges-index-tsx)
- `./useFocusMode` — [useFocusMode](#usefocusmode-ts)
- `./Sidebar` — [Sidebar](#sidebar-tsx)
- `./FilterToolbar` — [RelationFilter](#filtertoolbar-tsx)
- `./GraphView.css`

</details>

<details><summary>interfaces</summary>

- `interface Props` — `{ initialNodes, initialEdges: Edge[], isolated: CodeElement[], filters: RelationFilter }`

</details>

<details><summary>componentes</summary>

- `function GraphCanvas(props: Props)` — componente interno: aplica layout, filtra arestas por `filters`, computa estado de foco (nós/arestas opacos/visíveis), calcula offsets de arestas paralelas, handle de clique em nó e pane
- `export function GraphView(props: Props)` — wrapper público que envolve `GraphCanvas` em `ReactFlowProvider`

</details>

<details><summary>exporta</summary>

`GraphView`

</details>

</blockquote>
</details>

<details id="filtertoolbar-tsx">
<summary><strong><a href="src/features/graph/FilterToolbar.tsx">FilterToolbar.tsx</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `../../core/model/Relation` — [RelationType](#relation-ts)
- `./FilterToolbar.css`

</details>

<details><summary>tipos</summary>

- `export type RelationFilter = Record<RelationType, boolean>` — mapa de tipo de relação para visibilidade ativa

</details>

<details><summary>componentes</summary>

- `export function FilterToolbar({ filters, onChange, onReset }: Props)` — barra de filtros de relação com botões toggle por tipo e botão de reset

</details>

<details><summary>exporta</summary>

`RelationFilter`, `FilterToolbar`

</details>

- [FilterToolbar.css](src/features/graph/FilterToolbar.css) — estilos da barra de filtros

</blockquote>
</details>

<details id="sidebar-tsx">
<summary><strong><a href="src/features/graph/Sidebar.tsx">Sidebar.tsx</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `react` — useState
- `../../core/model/CodeElement` — [CodeElement](#codeelement-ts)
- `./Sidebar.css`

</details>

<details><summary>componentes</summary>

- `export function Sidebar({ isolated }: Props)` — painel lateral colapsável que lista elementos sem relações; retorna `null` se `isolated` estiver vazio

</details>

<details><summary>exporta</summary>

`Sidebar`

</details>

- [Sidebar.css](src/features/graph/Sidebar.css) — estilos do painel lateral
- [GraphView.css](src/features/graph/GraphView.css) — estilos do container do grafo

</blockquote>
</details>

<details id="usefocusmode-ts">
<summary><strong><a href="src/features/graph/useFocusMode.ts">useFocusMode.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `react` — useState

</details>

<details><summary>funcao</summary>

- `export function useFocusMode()` — hook que gerencia o nó em foco (`focusedId`); `focus(id)` alterna (click no mesmo nó desfoca); `clear()` limpa; retorna `{ focusedId, focus, clear }`

</details>

<details><summary>exporta</summary>

`useFocusMode`

</details>

</blockquote>
</details>

---

<details id="dir-features-graph-nodes">
<summary><strong>nodes/</strong></summary>
<blockquote>

<details id="basenode-tsx">
<summary><strong><a href="src/features/graph/nodes/BaseNode.tsx">BaseNode.tsx</a> [memo]</strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `react` — memo, useState
- `@xyflow/react` — Handle, Position
- `../../../core/graph/GraphBuilder` — [ElementNodeData](#graphbuilder-ts)
- `./BaseNode.css`

</details>

<details><summary>interfaces</summary>

- `export interface BaseNodeProps` — `{ data: ElementNodeData, selected: boolean, stereotype?: string, cssClass: string }`

</details>

<details><summary>componentes</summary>

- `export const BaseNode = memo(function BaseNode(...))` — nó base do diagrama UML: exibe stereotype, nome, e em estado expandido lista atributos e métodos com visibilidade e tipo; 8 handles (source + target em cada lado)

</details>

<details><summary>exporta</summary>

`BaseNodeProps`, `BaseNode`

</details>

- [BaseNode.css](src/features/graph/nodes/BaseNode.css) — estilos dos nós do diagrama

</blockquote>
</details>

<details id="nodes-index-tsx">
<summary><strong><a href="src/features/graph/nodes/index.tsx">nodes/index.tsx</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `@xyflow/react` — NodeProps
- `./BaseNode` — [BaseNode](#basenode-tsx), [BaseNodeProps](#basenode-tsx)
- `../../../core/graph/GraphBuilder` — [ElementNodeData](#graphbuilder-ts)

</details>

<details><summary>componentes exportados</summary>

Um componente wrapper por `ElementType`, cada um delegando para [BaseNode](#basenode-tsx) com `cssClass` e `stereotype` específicos:

- `ClassNode` — `poo-node--class`
- `AbstractNode` — `poo-node--abstract`, stereotype `«abstract»`
- `InterfaceNode` — `poo-node--interface`, stereotype `«interface»`
- `EnumNode` — `poo-node--enum`, stereotype `«enum»`
- `RecordNode` — `poo-node--record`, stereotype `«record»`
- `SealedNode` — `poo-node--sealed`, stereotype `«sealed»`
- `StructNode` — `poo-node--struct`, stereotype `«struct»`
- `ObjectNode` — `poo-node--object`, stereotype `«object»`
- `TraitNode` — `poo-node--trait`, stereotype `«trait»`
- `DataClassNode` — `poo-node--dataclass`, stereotype `«dataclass»`

</details>

<details><summary>exporta</summary>

Todos os componentes acima e `nodeTypes: Record<ElementType, Component>` — mapa para o ReactFlow

</details>

</blockquote>
</details>

</blockquote>
</details>

---

<details id="dir-features-graph-edges">
<summary><strong>edges/</strong></summary>
<blockquote>

<details id="edges-index-tsx">
<summary><strong><a href="src/features/graph/edges/index.tsx">edges/index.tsx</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `react` — memo, useEffect, useRef
- `@xyflow/react` — Position, EdgeProps
- `roughjs` — renderização sketchy das arestas

</details>

<details><summary>tipos internos</summary>

- `interface RoughEdgeProps extends EdgeProps` — adiciona `edgeStyle` e `colorVar`
- `edgeStyle`: `'dotted' | 'dotted-dense' | 'dashed' | 'solid' | 'solid-thick' | 'dash-dot' | 'double-dash'`

</details>

<details><summary>funcoes internas</summary>

- `buildPath(sx, sy, sp, tx, ty, tp, midFraction, srcOffset, tgtOffset)` — constrói caminho ortogonal de 3 segmentos e retorna `{ path, prevX, prevY }` para cálculo da seta
- `RoughEdge = memo(...)` — componente base: renderiza aresta com roughjs (linha + seta) em `<g ref>` via `useEffect`

</details>

<details><summary>componentes exportados</summary>

Um componente por `RelationType`, cada um delegando para `RoughEdge` com estilo e variável CSS de cor específicos:

- `ExtendsEdge` — `dotted`, `--edge-extends`
- `ImplementsEdge` — `dashed`, `--edge-implements`
- `FieldEdge` — `solid-thick`, `--edge-field`
- `ParameterEdge` — `dotted-dense`, `--edge-parameter`
- `ReturnsEdge` — `dash-dot`, `--edge-returns`
- `CreatesEdge` — `double-dash`, `--edge-creates`

</details>

<details><summary>exporta</summary>

Todos os componentes acima e `edgeTypes: Record<RelationType, Component>` — mapa para o ReactFlow

</details>

</blockquote>
</details>

</blockquote>
</details>

</blockquote>
</details>

---

<details id="dir-features-importer">
<summary><strong>src/features/importer/</strong></summary>
<blockquote>

<details id="importer-tsx">
<summary><strong><a href="src/features/importer/Importer.tsx">Importer.tsx</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `react` — useRef, ChangeEvent
- `./Importer.css`

</details>

<details><summary>interfaces</summary>

- `interface ImporterProps` — `{ onImport: (files: FileList) => void, loading: boolean, progress: number, total: number }`

</details>

<details><summary>componentes</summary>

- `export function Importer(...)` — tela inicial: botão "Selecionar pasta" dispara `<input webkitdirectory>`; durante loading exibe barra de progresso com `progress/total`

</details>

<details><summary>exporta</summary>

`Importer`

</details>

- [Importer.css](src/features/importer/Importer.css) — estilos da tela de importação

</blockquote>
</details>

<details id="useimporter-ts">
<summary><strong><a href="src/features/importer/useImporter.ts">useImporter.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `react` — useState
- `../../core/model/CodeElement` — [Language](#codeelement-ts)

</details>

<details><summary>funcao</summary>

- `export function useImporter()` — hook de gerenciamento de seleção de arquivos; `handleFolderSelect(fileList)` separa arquivos suportados de `.js` e atualiza estado; `getLanguage(filename)` mapeia extensão → Language; retorna `{ files, handleFolderSelect, getLanguage }`

</details>

<details><summary>exporta</summary>

`useImporter`

</details>

</blockquote>
</details>

---

<details id="dir-features-importer-tests">
<summary><strong>__tests__/</strong></summary>
<blockquote>

<details id="useimporter-test-ts">
<summary><strong><a href="src/features/importer/__tests__/useImporter.test.ts">useImporter.test.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `@testing-library/react` — renderHook, act
- `../useImporter` — [useImporter](#useimporter-ts)

</details>

<details><summary>cobertura</summary>

- Estado inicial vazio
- Aceita todas as extensões suportadas (java, kt, cs, ts, tsx, py, php, rb)
- Ignora extensões não suportadas (md, json, css)
- Separa `.js` em `jsFiles` e não inclui em `files`
- Substitui seleção anterior em nova chamada
- Mapeia cada extensão para a linguagem correta

</details>

</blockquote>
</details>

</blockquote>
</details>

</blockquote>
</details>

---

<details id="dir-shared-hooks">
<summary><strong>src/shared/hooks/</strong></summary>
<blockquote>

<details id="usetheme-ts">
<summary><strong><a href="src/shared/hooks/useTheme.ts">useTheme.ts</a></strong></summary>
<blockquote>

<details><summary>dependencias</summary>

- `react` — useState, useEffect

</details>

<details><summary>tipos</summary>

- `type Theme = 'light' | 'dark'`

</details>

<details><summary>funcao</summary>

- `export function useTheme()` — hook de tema: persiste em `localStorage` (`classview-theme`), aplica `data-theme` no `<html>`; padrão `'dark'`; retorna `{ theme, toggle }`

</details>

<details><summary>exporta</summary>

`useTheme`

</details>

</blockquote>
</details>

</blockquote>
</details>
