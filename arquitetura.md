# POOview — Arquitetura

## Visão geral

SPA React sem backend. Todo o processamento ocorre client-side via WebAssembly (Tree-sitter). Nenhum dado do usuário trafega pela rede.

```
Browser
├── Importer       → lê arquivos da pasta selecionada
├── ParserEngine   → detecta linguagem, delega ao LanguageParser correto
├── GraphBuilder   → transforma CodeElement[] + Relation[] em nós e arestas React Flow
└── UI             → renderiza grafo, modo foco, painel lateral
```

---

## Stack

| Camada | Tecnologia | Motivo |
|---|---|---|
| Framework | React 19 + TypeScript (strict) | Ecosistema de visualização, React Flow |
| Visualização | `@xyflow/react` (React Flow) | Nós interativos, modo foco, layout built-in |
| Parser | `web-tree-sitter` (WASM) | Universal, 100+ linguagens, roda no browser |
| Estética | `roughjs` | Bordas e setas hand-drawn (Excalidraw-inspired) |
| Build | Vite | WASM support nativo, rápido |
| Deploy | Vercel | Hosting estático |

---

## Estrutura de pastas

```
src/
├── core/
│   ├── model/
│   │   ├── CodeElement.ts       ← tipos centrais do domínio
│   │   └── Relation.ts
│   ├── parser/
│   │   ├── LanguageParser.ts    ← interface Strategy
│   │   ├── ParserRegistry.ts    ← mapeia extensão → parser
│   │   ├── ParserEngine.ts      ← orquestra parsing de todos os arquivos
│   │   └── languages/
│   │       ├── JavaParser.ts
│   │       ├── KotlinParser.ts
│   │       ├── CSharpParser.ts
│   │       ├── TypeScriptParser.ts
│   │       ├── PythonParser.ts
│   │       ├── PhpParser.ts
│   │       └── RubyParser.ts
│   └── graph/
│       └── GraphBuilder.ts      ← CodeElement[] → ReactFlow nodes/edges
├── features/
│   ├── importer/
│   │   ├── Importer.tsx         ← tela inicial, input webkitdirectory
│   │   └── useImporter.ts       ← hook: lê FileList, filtra por extensão
│   ├── graph/
│   │   ├── GraphView.tsx        ← canvas principal React Flow
│   │   ├── nodes/
│   │   │   ├── ClassNode.tsx
│   │   │   ├── AbstractNode.tsx
│   │   │   ├── InterfaceNode.tsx
│   │   │   ├── EnumNode.tsx
│   │   │   ├── RecordNode.tsx
│   │   │   ├── SealedNode.tsx
│   │   │   ├── StructNode.tsx
│   │   │   ├── ObjectNode.tsx
│   │   │   ├── TraitNode.tsx
│   │   │   └── DataClassNode.tsx
│   │   ├── edges/
│   │   │   ├── ExtendsEdge.tsx
│   │   │   ├── ImplementsEdge.tsx
│   │   │   └── DependsEdge.tsx
│   │   └── useFocusMode.ts      ← hook: controla modo foco
│   └── sidebar/
│       ├── Sidebar.tsx          ← painel de elementos sem relacionamento
│       └── useSidebar.ts
├── shared/
│   ├── components/
│   │   ├── FilterToolbar.tsx    ← toggles extends/implements/depends
│   │   └── ProgressBar.tsx
│   └── hooks/
│       └── useTheme.ts          ← dark/light toggle
└── App.tsx
```

---

## Modelo de dados

```ts
// core/model/CodeElement.ts

export type ElementType = 'class' | 'abstract' | 'interface' | 'enum' | 'record' | 'sealed' | 'struct' | 'object' | 'trait' | 'dataclass'
export type Language = 'java' | 'kotlin' | 'csharp' | 'typescript' | 'python' | 'php' | 'ruby'

export interface Attribute {
  visibility: '+' | '-' | '#' | '~'
  name: string
  type: string
}

export interface Method {
  visibility: '+' | '-' | '#' | '~'
  name: string
  params: string
  returnType: string
}

export interface CodeElement {
  id: string           // hash do filePath + nome
  name: string
  type: ElementType
  language: Language
  attributes: Attribute[]
  methods: Method[]
  filePath: string
}

// core/model/Relation.ts

export type RelationType = 'extends' | 'implements' | 'depends'

export interface Relation {
  source: string       // id do CodeElement origem
  target: string       // id do CodeElement destino
  type: RelationType
}
```

---

## Design Pattern — Strategy (parsers)

Cada linguagem implementa `LanguageParser`. O `ParserEngine` depende apenas da abstração — nunca das implementações concretas (DIP). Adicionar uma nova linguagem não altera nenhuma classe existente (OCP).

```ts
// core/parser/LanguageParser.ts

export interface LanguageParser {
  readonly language: Language
  readonly extensions: string[]
  parse(tree: Parser.Tree, source: string): { elements: CodeElement[], relations: Relation[] }
}

// core/parser/ParserRegistry.ts

export class ParserRegistry {
  private parsers = new Map<string, LanguageParser>()

  register(parser: LanguageParser): void {
    parser.extensions.forEach(ext => this.parsers.set(ext, parser))
  }

  resolve(filename: string): LanguageParser | null {
    const ext = filename.slice(filename.lastIndexOf('.'))
    return this.parsers.get(ext) ?? null
  }
}

// core/parser/ParserEngine.ts

export class ParserEngine {
  constructor(private registry: ParserRegistry) {}

  async parseAll(files: File[]): Promise<{ elements: CodeElement[], relations: Relation[] }> {
    // carrega gramáticas WASM das linguagens detectadas
    // itera os arquivos, delega ao parser correto
    // agrega e retorna resultado
  }
}
```

---

## Fluxo de dados

```
1. Usuário seleciona pasta
        ↓
2. useImporter filtra arquivos por extensão reconhecida
        ↓
3. ParserEngine detecta linguagens presentes → carrega gramáticas WASM sob demanda
        ↓
4. Para cada arquivo: LanguageParser.parse() → CodeElement[] + Relation[]
        ↓
5. GraphBuilder converte para ReactFlow Node[] + Edge[]
        ↓
6. GraphView renderiza o grafo
        ↓
7. Usuário clica em nó → useFocusMode ativa modo foco:
   - nó selecionado expande (atributos + métodos)
   - dependências diretas permanecem visíveis
   - demais nós e arestas ficam opacos
        ↓
8. Clique fora ou no nó → modo foco encerrado, grafo restaurado
```

---

## Nós — diferenciação visual

| Tipo | Borda | Estereótipo |
|---|---|---|
| `class` | Sólida | — |
| `abstract` | Tracejada | `«abstract»` |
| `interface` | Sólida | `«interface»` |
| `enum` | Sólida | `«enum»` |
| `record` | Sólida | `«record»` |
| `sealed` | Dupla | `«sealed»` |
| `struct` | Sólida | `«struct»` |
| `object` | Sólida | `«object»` |
| `trait` | Tracejada | `«trait»` |
| `dataclass` | Sólida | `«dataclass»` |

Todos os nós usam `roughjs` para bordas com estética hand-drawn.

---

## Arestas — diferenciação visual

| Relação | Estilo |
|---|---|
| `extends` | Pontilhada |
| `implements` | Tracejada |
| `depends` | Sólida e contínua |

---

## Carregamento de gramáticas WASM

As gramáticas são carregadas **sob demanda** — apenas as linguagens presentes no projeto importado são inicializadas. Isso evita carregar 7 gramáticas WASM desnecessariamente em projetos mono-linguagem.

```
Projeto Java puro → carrega apenas tree-sitter-java.wasm
Projeto com Java + TypeScript → carrega java + typescript
```

---

## Fora do escopo desta arquitetura

- Backend / API
- Persistência de dados
- Autenticação
- Suporte a linguagens não-OOP
