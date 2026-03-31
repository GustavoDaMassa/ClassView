import { useState, useCallback } from 'react'
import './index.css'

import { Importer } from './features/importer/Importer'
import { GraphView } from './features/graph/GraphView'
import { FilterToolbar } from './features/graph/FilterToolbar'
import type { RelationFilter } from './features/graph/FilterToolbar'
import { useTheme } from './shared/hooks/useTheme'
import { buildGraph } from './core/graph/GraphBuilder'
import type { ElementNode } from './core/graph/GraphBuilder'
import { ParserEngine } from './core/parser/ParserEngine'
import { createRegistry } from './core/parser/createRegistry'
import type { CodeElement } from './core/model/CodeElement'
import type { Edge } from '@xyflow/react'

type AppState = 'import' | 'graph'

const DEFAULT_FILTERS: RelationFilter = {
  extends: true,
  implements: true,
  depends: true,
}

interface GraphData {
  nodes: ElementNode[]
  edges: Edge[]
  isolated: CodeElement[]
}

const engine = new ParserEngine(createRegistry())

export default function App() {
  const { theme, toggle } = useTheme()
  const [state, setState] = useState<AppState>('import')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [filters, setFilters] = useState<RelationFilter>(DEFAULT_FILTERS)

  const handleImport = useCallback(async (files: FileList) => {
    setLoading(true)
    setProgress(0)
    setTotal(0)

    try {
      const fileArray = Array.from(files)
      const result = await engine.parseAll(fileArray, {
        onProgress(parsed, total) {
          setProgress(parsed)
          setTotal(total)
        },
      })

      const { nodes, edges, isolated } = buildGraph(result.elements, result.relations)
      setGraphData({ nodes, edges, isolated })
      setState('graph')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleReset = useCallback(() => {
    setState('import')
    setGraphData(null)
    setFilters(DEFAULT_FILTERS)
    setProgress(0)
    setTotal(0)
  }, [])

  return (
    <div className="app">
      {state === 'import' ? (
        <Importer
          onImport={handleImport}
          loading={loading}
          progress={progress}
          total={total}
        />
      ) : (
        <>
          <FilterToolbar
            filters={filters}
            onChange={setFilters}
            theme={theme}
            onToggleTheme={toggle}
            onReset={handleReset}
          />
          {graphData && (
            <GraphView
              initialNodes={graphData.nodes}
              initialEdges={graphData.edges}
              isolated={graphData.isolated}
              filters={filters}
            />
          )}
        </>
      )}
    </div>
  )
}
