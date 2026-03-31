# POOview — Requisitos

## Visão geral

Aplicação web que analisa projetos de software orientados a objetos, identifica automaticamente classes, contratos, heranças e dependências a partir dos arquivos fonte, e exibe essa estrutura em uma interface visual interativa — sem backend, sem armazenamento de dados.

---

## Requisitos Funcionais

### RF01 — Importação de projeto

- O usuário seleciona uma pasta local diretamente pelo browser (`<input webkitdirectory>`)
- Nenhum arquivo sai da máquina do usuário — todo processamento é client-side
- A aplicação detecta automaticamente a linguagem de cada arquivo pela extensão:

| Extensão | Linguagem |
|---|---|
| `.java` | Java |
| `.kt` | Kotlin |
| `.cs` | C# |
| `.ts`, `.tsx` | TypeScript |
| `.py` | Python |
| `.php` | PHP |
| `.rb` | Ruby |

- Arquivos com extensões não reconhecidas são ignorados silenciosamente
- Arquivos `.js` são ignorados (fora do escopo OOP) com aviso informativo ao usuário

### RF02 — Parsing e análise estática

- O parsing é realizado client-side via `web-tree-sitter` (WebAssembly)
- A gramática de cada linguagem é carregada sob demanda conforme as linguagens detectadas no projeto
- Para cada arquivo fonte, a análise extrai:
  - Nome da classe / interface / enum / classe abstrata
  - Tipo do elemento (class, abstract class, interface, enum, record, sealed, struct, object, trait, dataclass)
  - Atributos: visibilidade, nome, tipo
  - Métodos: visibilidade, nome, parâmetros, tipo de retorno
  - Herança (`extends`)
  - Contratos implementados (`implements`)
  - Dependências (tipos referenciados internamente)
  - Linguagem de origem

#### Nível de suporte por linguagem

| Linguagem | Classes | Herança | Contratos | Atributos/Métodos |
|---|---|---|---|---|
| Java | Completo | Completo | Completo | Completo |
| Kotlin | Completo | Completo | Completo | Completo |
| C# | Completo | Completo | Completo | Completo |
| TypeScript | Completo | Completo | Completo | Completo |
| Python | Parcial | Completo | Não se aplica | Completo |
| PHP | Parcial | Completo | Parcial | Completo |
| Ruby | Parcial | Completo | Não se aplica | Completo |

### RF03 — Grafo principal

- A tela principal exibe o grafo completo do projeto após o parsing
- Cada nó representa um elemento do código (classe, interface, enum, etc.)
- As arestas representam os relacionamentos entre elementos
- O grafo suporta zoom e pan
- O layout é calculado automaticamente (dagre ou similar)

#### Tipos de nó e diferenciação visual

| Tipo | Estilo |
|---|---|
| Class | Retângulo sólido |
| Abstract class | Retângulo com borda tracejada |
| Interface | Retângulo com estereótipo `«interface»` |
| Enum | Retângulo com estereótipo `«enum»` |
| Record | Retângulo com estereótipo `«record»` |
| Sealed | Retângulo com borda dupla e estereótipo `«sealed»` |
| Struct | Retângulo com estereótipo `«struct»` |
| Object | Retângulo com estereótipo `«object»` |
| Trait | Retângulo com borda tracejada e estereótipo `«trait»` |
| Dataclass | Retângulo com estereótipo `«dataclass»` |

- A diferenciação visual entre nós é feita exclusivamente pelo tipo do elemento (estilo de borda e estereótipo)

#### Tipos de aresta e diferenciação visual

| Relação | Estilo da seta |
|---|---|
| `extends` | Pontilhada |
| `implements` | Tracejada |
| Dependência | Sólida e contínua |

#### Filtros de relacionamento

- A interface oferece toggles para exibir ou ocultar cada tipo de relação independentemente:
  - `extends`
  - `implements`
  - Dependências

### RF04 — Detalhe do nó (modo foco)

- Ao clicar em um nó, a interface entra em modo foco:
  - O nó selecionado expande in-place exibindo atributos e métodos no formato UML:
    - Atributos: `visibilidade nome: Tipo`
    - Métodos: `visibilidade nome(params): Retorno`
  - Os nós que a classe selecionada conhece (dependências diretas) permanecem visíveis e destacados no grafo
  - Todos os demais nós e arestas do grafo ficam opacos
- O modo foco é encerrado ao clicar fora do nó ou clicar novamente no próprio nó, restaurando o grafo completo

### RF05 — Arquivos sem relacionamento

- Arquivos fonte que não possuem herança, contratos ou dependências com outros elementos do projeto são listados em um painel lateral colapsável
- O painel exibe nome do arquivo, tipo do elemento e linguagem
- Os elementos do painel são clicáveis e navegam para o nó correspondente no grafo (se presente) ou exibem os detalhes do elemento

### RF06 — Estética visual

- Design inspirado no Excalidraw: bordas e setas com aparência de desenho à mão, utilizando `roughjs`
- Nós com formato predominantemente quadrado/retangular
- Interface com suporte a tema claro e escuro

---

## Requisitos Não Funcionais

### RNF01 — Processamento client-side

- Todo o parsing e análise ocorre no browser, sem envio de dados para servidor externo
- Nenhum dado do projeto do usuário é transmitido pela rede

### RNF02 — Performance

- O parsing deve ser realizado de forma assíncrona, sem bloquear a interface
- Exibir feedback de progresso durante o carregamento e parsing (barra ou indicador)
- Gramáticas Tree-sitter carregadas sob demanda (lazy loading) — apenas as linguagens presentes no projeto

### RNF03 — Compatibilidade

- Suporte aos browsers modernos: Chrome, Edge, Firefox, Safari
- Layout responsivo — utilizável em telas a partir de 1280px de largura

### RNF04 — Deploy

- Aplicação estática, sem backend
- Deploy na Vercel

### RNF05 — Stack

| Camada | Tecnologia |
|---|---|
| Framework | React |
| Linguagem | TypeScript |
| Parser | `web-tree-sitter` (WASM) |
| Visualização de grafo | React Flow (`@xyflow/react`) |
| Estética hand-drawn | `roughjs` |
| Deploy | Vercel |

### RNF06 — Qualidade de código

- TypeScript estrito (`strict: true`)
- Componentes funcionais com hooks
- Sem dependências de backend ou servidor de terceiros em runtime

---

## Fora do escopo

- Autenticação e contas de usuário
- Persistência ou histórico de análises
- Suporte a linguagens não-OOP (Go, JavaScript puro, Rust, etc.)
- Edição de código
- Geração de código a partir do grafo
- Análise de qualidade ou métricas (cobertura, complexidade ciclomática, etc.)
