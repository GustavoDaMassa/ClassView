import type { RelationType } from '../../core/model/Relation'
import './FilterToolbar.css'

export type RelationFilter = Record<RelationType, boolean>

interface Props {
  filters: RelationFilter
  onChange: (filters: RelationFilter) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onReset: () => void
}

const LABELS: Record<RelationType, string> = {
  extends: 'extends',
  implements: 'implements',
  depends: 'depende',
}

const DOTS: Record<RelationType, string> = {
  extends: 'dotted',
  implements: 'dashed',
  depends: 'solid',
}

export function FilterToolbar({ filters, onChange, theme, onToggleTheme, onReset }: Props) {
  function toggle(type: RelationType) {
    onChange({ ...filters, [type]: !filters[type] })
  }

  return (
    <div className="filter-toolbar">
      <span className="filter-toolbar__title">POOview</span>

      <div className="filter-toolbar__filters">
        {(Object.keys(filters) as RelationType[]).map(type => (
          <button
            key={type}
            className={`filter-btn filter-btn--${type} ${filters[type] ? 'filter-btn--active' : ''}`}
            onClick={() => toggle(type)}
          >
            <span className={`filter-btn__line filter-btn__line--${DOTS[type]}`} />
            {LABELS[type]}
          </button>
        ))}
      </div>

      <div className="filter-toolbar__actions">
        <button className="toolbar-btn" onClick={onReset} title="Nova análise">
          ↩ nova análise
        </button>
        <button className="toolbar-btn" onClick={onToggleTheme} title="Alternar tema">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </div>
  )
}
