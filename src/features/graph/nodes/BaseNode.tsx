import { memo, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { ElementNodeData } from '../../../core/graph/GraphBuilder'
import './BaseNode.css'

export interface BaseNodeProps {
  data: ElementNodeData
  selected: boolean
  stereotype?: string
  cssClass: string
}

export const BaseNode = memo(function BaseNode({
  data,
  selected,
  stereotype,
  cssClass,
}: BaseNodeProps) {
  const [expanded, setExpanded] = useState(false)
  const { element } = data

  function handleClick() {
    setExpanded(prev => !prev)
  }

  return (
    <div
      className={`poo-node ${cssClass} ${selected ? 'poo-node--selected' : ''} ${expanded ? 'poo-node--expanded' : ''}`}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} />

      {stereotype && (
        <div className="poo-node__stereotype">{stereotype}</div>
      )}
      <div className="poo-node__name">{element.name}</div>

      {expanded && (
        <div className="poo-node__details">
          {element.attributes.length > 0 && (
            <div className="poo-node__section">
              <div className="poo-node__divider" />
              {element.attributes.map((attr, i) => (
                <div key={i} className="poo-node__member">
                  <span className="poo-node__visibility">{attr.visibility}</span>
                  <span className="poo-node__member-name">{attr.name}</span>
                  {attr.type && (
                    <span className="poo-node__member-type">: {attr.type}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {element.methods.length > 0 && (
            <div className="poo-node__section">
              <div className="poo-node__divider" />
              {element.methods.map((method, i) => (
                <div key={i} className="poo-node__member">
                  <span className="poo-node__visibility">{method.visibility}</span>
                  <span className="poo-node__member-name">{method.name}</span>
                  <span className="poo-node__member-type">{method.params}</span>
                  {method.returnType && (
                    <span className="poo-node__member-type">: {method.returnType}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
})
