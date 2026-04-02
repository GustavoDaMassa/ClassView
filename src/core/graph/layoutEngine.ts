import type { Node, Edge } from '@xyflow/react'

const NODE_WIDTH = 200
const NODE_HEIGHT = 80

// Force simulation constants
const REPULSION = 90000      // how strongly nodes push each other away
const SPRING_LENGTH = 620    // ideal edge length
const SPRING_K = 0.025       // edge spring stiffness
const GRAVITY = 0.005        // pull toward center (prevents drift)
const DAMPING = 0.82         // velocity decay per step
const ITERATIONS = 500       // simulation steps
const MIN_NODE_DIST = Math.sqrt(NODE_WIDTH ** 2 + NODE_HEIGHT ** 2) + 100  // collision threshold

interface Vec2 { x: number; y: number; vx: number; vy: number }

export function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes
  if (nodes.length === 1) {
    return [{ ...nodes[0], position: { x: 0, y: 0 } }]
  }

  // Seed positions on a circle so the simulation starts spread out
  const radius = Math.max(200, nodes.length * 30)
  const state = new Map<string, Vec2>(
    nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length
      return [
        n.id,
        {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        },
      ]
    }),
  )

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const cooling = 1 - iter / ITERATIONS
    const fx = new Map<string, number>(nodes.map(n => [n.id, 0]))
    const fy = new Map<string, number>(nodes.map(n => [n.id, 0]))

    // Repulsion: every pair of nodes pushes each other away
    for (let i = 0; i < nodes.length - 1; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = state.get(nodes[i].id)!
        const b = state.get(nodes[j].id)!
        const dx = a.x - b.x
        const dy = a.y - b.y
        const dist2 = dx * dx + dy * dy + 1
        const dist = Math.sqrt(dist2)
        // Extra strong collision force when nodes are too close
        const base = dist < MIN_NODE_DIST ? REPULSION * 8 : REPULSION
        const force = base / dist2
        const nx = (dx / dist) * force
        const ny = (dy / dist) * force
        fx.set(nodes[i].id, fx.get(nodes[i].id)! + nx)
        fy.set(nodes[i].id, fy.get(nodes[i].id)! + ny)
        fx.set(nodes[j].id, fx.get(nodes[j].id)! - nx)
        fy.set(nodes[j].id, fy.get(nodes[j].id)! - ny)
      }
    }

    // Spring attraction: connected nodes are pulled toward each other
    for (const edge of edges) {
      const a = state.get(edge.source)
      const b = state.get(edge.target)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
      const stretch = dist - SPRING_LENGTH
      const force = SPRING_K * stretch
      const nx = (dx / dist) * force
      const ny = (dy / dist) * force
      fx.set(edge.source, fx.get(edge.source)! + nx)
      fy.set(edge.source, fy.get(edge.source)! + ny)
      fx.set(edge.target, fx.get(edge.target)! - nx)
      fy.set(edge.target, fy.get(edge.target)! - ny)
    }

    // Integrate: update velocity and position
    for (const node of nodes) {
      const s = state.get(node.id)!
      s.vx = (s.vx + fx.get(node.id)!) * DAMPING
      s.vy = (s.vy + fy.get(node.id)!) * DAMPING
      s.x += s.vx * cooling
      s.y += s.vy * cooling
      // Gravity toward origin
      s.x -= s.x * GRAVITY * cooling
      s.y -= s.y * GRAVITY * cooling
    }
  }

  // Post-simulation overlap resolution: push apart any remaining overlapping nodes
  for (let pass = 0; pass < 20; pass++) {
    for (let i = 0; i < nodes.length - 1; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = state.get(nodes[i].id)!
        const b = state.get(nodes[j].id)!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        if (dist < MIN_NODE_DIST) {
          const push = (MIN_NODE_DIST - dist) / 2
          const nx = (dx / dist) * push
          const ny = (dy / dist) * push
          a.x -= nx; a.y -= ny
          b.x += nx; b.y += ny
        }
      }
    }
  }

  return nodes.map(node => {
    const s = state.get(node.id)!
    return {
      ...node,
      position: {
        x: s.x - NODE_WIDTH / 2,
        y: s.y - NODE_HEIGHT / 2,
      },
    }
  })
}
