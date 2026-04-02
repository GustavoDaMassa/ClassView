import { memo, useEffect, useRef } from 'react'
import { Position } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import rough from 'roughjs'

const ARROW_LEN = 10
const ARROW_SPREAD = Math.PI / 6

interface RoughEdgeProps extends EdgeProps {
  edgeStyle: 'dotted' | 'dotted-dense' | 'dashed' | 'solid' | 'solid-thick' | 'dash-dot' | 'double-dash'
  colorVar: string
}

/**
 * Builds a 3-segment orthogonal path and returns both the SVG path string
 * and the second-to-last point (used to compute the arrowhead angle).
 */
function buildPath(
  sx: number, sy: number, sp: Position,
  tx: number, ty: number, tp: Position,
  midFraction: number,
  srcOffset: number, tgtOffset: number,
): { path: string; prevX: number; prevY: number } {
  const isVertSrc = sp === Position.Top || sp === Position.Bottom
  const isVertTgt = tp === Position.Top || tp === Position.Bottom

  // Apply offset perpendicular to exit direction
  const osx = isVertSrc ? sx + srcOffset : sx
  const osy = isVertSrc ? sy : sy + srcOffset
  const otx = isVertTgt ? tx + tgtOffset : tx
  const oty = isVertTgt ? ty : ty + tgtOffset

  if (isVertSrc && isVertTgt) {
    const midY = osy + (oty - osy) * midFraction
    return {
      path: `M ${osx},${osy} L ${osx},${midY} L ${otx},${midY} L ${otx},${oty}`,
      prevX: otx, prevY: midY,
    }
  }

  if (!isVertSrc && !isVertTgt) {
    const midX = osx + (otx - osx) * midFraction
    return {
      path: `M ${osx},${osy} L ${midX},${osy} L ${midX},${oty} L ${otx},${oty}`,
      prevX: midX, prevY: oty,
    }
  }

  // Mixed: L-shape — exit in source direction, then straight to target
  if (isVertSrc) {
    return {
      path: `M ${osx},${osy} L ${osx},${oty} L ${otx},${oty}`,
      prevX: osx, prevY: oty,
    }
  } else {
    return {
      path: `M ${osx},${osy} L ${otx},${osy} L ${otx},${oty}`,
      prevX: otx, prevY: osy,
    }
  }
}

const RoughEdge = memo(function RoughEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  edgeStyle,
  colorVar,
}: RoughEdgeProps) {
  const svgRef = useRef<SVGGElement>(null)

  const srcOffset = (data?.sourceOffsetX as number) ?? 0
  const tgtOffset = (data?.targetOffsetX as number) ?? 0
  const midFraction = (data?.midFraction as number) ?? 0.5

  const sp = sourcePosition ?? Position.Bottom
  const tp = targetPosition ?? Position.Top

  const { path: edgePath, prevX, prevY } = buildPath(
    sourceX, sourceY, sp,
    targetX, targetY, tp,
    midFraction, srcOffset, tgtOffset,
  )

  const isVertTgt = tp === Position.Top || tp === Position.Bottom
  const finalTX = isVertTgt ? targetX + tgtOffset : targetX
  const finalTY = isVertTgt ? targetY : targetY + tgtOffset

  useEffect(() => {
    const el = svgRef.current
    if (!el) return

    while (el.firstChild) el.removeChild(el.firstChild)

    const color = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim()
    const rc = rough.svg(el.ownerSVGElement as SVGSVGElement)

    const strokeLineDash =
      edgeStyle === 'dotted'        ? [2, 6] :
      edgeStyle === 'dotted-dense'  ? [2, 3] :
      edgeStyle === 'dashed'        ? [8, 5] :
      edgeStyle === 'dash-dot'      ? [8, 4, 2, 4] :
      edgeStyle === 'double-dash'   ? [12, 3, 12, 3] :
      undefined

    const strokeWidth =
      edgeStyle === 'solid-thick' ? 2.5 : 1.5

    el.appendChild(rc.path(edgePath, {
      stroke: color, strokeWidth, roughness: 0.8, bowing: 0.5, strokeLineDash, fill: 'none',
    }))

    // Arrowhead: direction from second-to-last point → target
    const angle = Math.atan2(finalTY - prevY, finalTX - prevX)
    const ax1 = finalTX - ARROW_LEN * Math.cos(angle - ARROW_SPREAD)
    const ay1 = finalTY - ARROW_LEN * Math.sin(angle - ARROW_SPREAD)
    const ax2 = finalTX - ARROW_LEN * Math.cos(angle + ARROW_SPREAD)
    const ay2 = finalTY - ARROW_LEN * Math.sin(angle + ARROW_SPREAD)

    const arrowOpts = { stroke: color, strokeWidth: 1.5, roughness: 0.6, strokeLineDash: undefined }
    el.appendChild(rc.line(finalTX, finalTY, ax1, ay1, arrowOpts))
    el.appendChild(rc.line(finalTX, finalTY, ax2, ay2, arrowOpts))
  }, [edgePath, edgeStyle, colorVar, finalTX, finalTY, prevX, prevY])

  return <g ref={svgRef} />
})

export const ExtendsEdge = memo(function ExtendsEdge(props: EdgeProps) {
  return <RoughEdge {...props} edgeStyle="dotted" colorVar="--edge-extends" />
})

export const ImplementsEdge = memo(function ImplementsEdge(props: EdgeProps) {
  return <RoughEdge {...props} edgeStyle="dashed" colorVar="--edge-implements" />
})

export const FieldEdge = memo(function FieldEdge(props: EdgeProps) {
  return <RoughEdge {...props} edgeStyle="solid-thick" colorVar="--edge-field" />
})

export const ParameterEdge = memo(function ParameterEdge(props: EdgeProps) {
  return <RoughEdge {...props} edgeStyle="dotted-dense" colorVar="--edge-parameter" />
})

export const ReturnsEdge = memo(function ReturnsEdge(props: EdgeProps) {
  return <RoughEdge {...props} edgeStyle="dash-dot" colorVar="--edge-returns" />
})

export const CreatesEdge = memo(function CreatesEdge(props: EdgeProps) {
  return <RoughEdge {...props} edgeStyle="double-dash" colorVar="--edge-creates" />
})

export const edgeTypes = {
  extends: ExtendsEdge,
  implements: ImplementsEdge,
  field: FieldEdge,
  parameter: ParameterEdge,
  returns: ReturnsEdge,
  creates: CreatesEdge,
}
