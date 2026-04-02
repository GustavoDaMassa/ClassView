<div align="center">

<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 100 100">
  <polygon points="50,4 93,27.5 93,72.5 50,96 7,72.5 7,27.5" fill="none" stroke="#388bfd" stroke-width="6" stroke-linejoin="round"/>
</svg>

# ClassView

**Interactive OOP visualizer — select a project folder, explore your class graph.**

Analyzes source files entirely in the browser via WebAssembly and renders classes, interfaces, abstract classes, enums, records and all their relationships as an interactive graph.

</div>

---

## Features

- **No backend** — parsing runs 100% client-side via [tree-sitter](https://tree-sitter.github.io/) WASM
- **Multi-language** — Java, Kotlin, C#, TypeScript, Python, PHP, Ruby
- **6 relation types** — extends, implements, field, parameter, returns, creates
- **Interactive graph** — force-directed layout, zoom, pan, drag
- **Focus mode** — click a node to highlight it and its direct connections
- **Relation filters** — toggle each relation type independently
- **Isolated panel** — classes with no connections listed separately

## Supported Languages

| Language | Class | Abstract | Interface | Enum | Record | Sealed | Struct | Object | Trait | Dataclass |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Java | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | | |
| Kotlin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | | |
| C# | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | |
| TypeScript | ✓ | ✓ | ✓ | ✓ | | | | | | |
| Python | ✓ | | | | | | | | | ✓ |
| PHP | ✓ | ✓ | ✓ | ✓ | | | | | ✓ | |
| Ruby | ✓ | | | | | | | | ✓ | |

## Detected Relations

| Type | Meaning | Visual |
|---|---|---|
| `extends` | Inheritance | Dotted |
| `implements` | Interface / contract | Dashed |
| `field` | Attribute of that type | Solid thick |
| `parameter` | Method parameter of that type | Dense dotted |
| `returns` | Method return type | Dash-dot |
| `creates` | Instantiation / static access | Double dash |

## Stack

- [React 19](https://react.dev/) + TypeScript (strict)
- [web-tree-sitter](https://github.com/tree-sitter/tree-sitter) — client-side WASM parsing
- [@xyflow/react](https://reactflow.dev/) — interactive graph canvas
- [roughjs](https://roughjs.com/) — hand-drawn edge style
- [Vitest](https://vitest.dev/) — unit tests

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), click **Selecionar pasta** and pick any project directory.

## Scripts

```bash
npm run dev        # dev server with hot reload
npm run build      # production build
npm run preview    # serve the production build locally
npm test           # run tests in watch mode
npm run test:run   # run tests once
npm run coverage   # test coverage report
```
