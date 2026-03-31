import { memo, useEffect, useRef } from 'react'
import { getBezierPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import rough from 'roughjs'

interface RoughEdgeProps extends EdgeProps {
  edgeStyle: 'dotted' | 'dashed' | 'solid'
  colorVar: string
}

const RoughEdge = memo(function RoughEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  edgeStyle,
  colorVar,
}: RoughEdgeProps) {
  const svgRef = useRef<SVGGElement>(null)

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  useEffect(() => {
    const el = svgRef.current
    if (!el) return

    while (el.firstChild) el.removeChild(el.firstChild)

    const color = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim()

    const rc = rough.svg(el.ownerSVGElement as SVGSVGElement)

    const strokeLineDash =
      edgeStyle === 'dotted' ? [2, 6] : edgeStyle === 'dashed' ? [8, 5] : undefined

    const path = rc.path(edgePath, {
      stroke: color,
      strokeWidth: 1.5,
      roughness: 0.8,
      bowing: 0.5,
      strokeLineDash,
      fill: 'none',
    })

    el.appendChild(path)
  }, [edgePath, edgeStyle, colorVar])

  return (
    <>
      <g ref={svgRef} />
    </>
  )
})

export const ExtendsEdge = memo(function ExtendsEdge(props: EdgeProps) {
  return <RoughEdge {...props} edgeStyle="dotted" colorVar="--edge-extends" />
})

export const ImplementsEdge = memo(function ImplementsEdge(props: EdgeProps) {
  return <RoughEdge {...props} edgeStyle="dashed" colorVar="--edge-implements" />
})

export const DependsEdge = memo(function DependsEdge(props: EdgeProps) {
  return <RoughEdge {...props} edgeStyle="solid" colorVar="--edge-depends" />
})

export const edgeTypes = {
  extends: ExtendsEdge,
  implements: ImplementsEdge,
  depends: DependsEdge,
}
