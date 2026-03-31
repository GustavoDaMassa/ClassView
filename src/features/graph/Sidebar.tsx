import { useState } from 'react'
import type { CodeElement } from '../../core/model/CodeElement'
import './Sidebar.css'

interface Props {
  isolated: CodeElement[]
}

export function Sidebar({ isolated }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  if (isolated.length === 0) return null

  return (
    <div className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header" onClick={() => setCollapsed(prev => !prev)}>
        <span className="sidebar__title">Isolados ({isolated.length})</span>
        <span className="sidebar__toggle">{collapsed ? '›' : '‹'}</span>
      </div>
      {!collapsed && (
        <ul className="sidebar__list">
          {isolated.map(el => (
            <li key={el.id} className={`sidebar__item sidebar__item--${el.type}`}>
              <span className="sidebar__stereotype">«{el.type}»</span>
              <span className="sidebar__name">{el.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
