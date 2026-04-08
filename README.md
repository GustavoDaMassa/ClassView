<div align="center">

<img src="src/assets/classviewlogo.png" alt="ClassView" width="200"/>

# ClassView

**Visualizador interativo de OOP — selecione uma pasta de projeto e explore o grafo de classes.**

Analisa os arquivos fonte inteiramente no navegador via WebAssembly e renderiza classes, interfaces, classes abstratas, enums, records e todos os seus relacionamentos como um grafo interativo.

</div>

---

## Funcionalidades

- **Sem backend** — o parsing roda 100% no cliente via [tree-sitter](https://tree-sitter.github.io/) WASM
- **Multi-linguagem** — Java, Kotlin, C#, TypeScript, Python, PHP, Ruby
- **6 tipos de relação** — extends, implements, field, parameter, returns, creates
- **Grafo interativo** — layout force-directed, zoom, pan, arrastar
- **Modo foco** — clique em um nó para destacá-lo e suas conexões diretas
- **Filtros de relação** — ative/desative cada tipo de relação independentemente
- **Painel de isolados** — classes sem conexões listadas separadamente

## Linguagens Suportadas

| Linguagem | Class | Abstract | Interface | Enum | Record | Sealed | Struct | Object | Trait | Dataclass |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Java | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | | |
| Kotlin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | | |
| C# | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | |
| TypeScript | ✓ | ✓ | ✓ | ✓ | | | | | | |
| Python | ✓ | | | | | | | | | ✓ |
| PHP | ✓ | ✓ | ✓ | ✓ | | | | | ✓ | |
| Ruby | ✓ | | | | | | | | ✓ | |

## Relações Detectadas

| Tipo | Significado | Visual |
|---|---|---|
| `extends` | Herança | Pontilhado |
| `implements` | Interface / contrato | Tracejado |
| `field` | Atributo desse tipo | Sólido espesso |
| `parameter` | Parâmetro de método desse tipo | Pontilhado denso |
| `returns` | Tipo de retorno de método | Traço-ponto |
| `creates` | Instanciação / acesso estático | Traço duplo |

## Tecnologias

- [React 19](https://react.dev/) + TypeScript (strict)
- [web-tree-sitter](https://github.com/tree-sitter/tree-sitter) — parsing WASM no cliente
- [@xyflow/react](https://reactflow.dev/) — canvas de grafo interativo
- [roughjs](https://roughjs.com/) — estilo de arestas desenhado à mão
- [Vitest](https://vitest.dev/) — testes unitários

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173), clique em **Selecionar pasta** e escolha qualquer diretório de projeto.

## Scripts

```bash
npm run dev        # servidor de desenvolvimento com hot reload
npm run build      # build de produção
npm run preview    # servir o build de produção localmente
npm test           # rodar testes em modo watch
npm run test:run   # rodar testes uma vez
npm run coverage   # relatório de cobertura de testes
```
