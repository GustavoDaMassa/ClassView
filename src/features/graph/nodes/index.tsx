import type { NodeProps } from '@xyflow/react'
import { BaseNode } from './BaseNode'
import type { ElementNodeData } from '../../../core/graph/GraphBuilder'

type Props = NodeProps & { data: ElementNodeData }

export function ClassNode(props: Props) {
  return <BaseNode {...props} cssClass="poo-node--class" />
}

export function AbstractNode(props: Props) {
  return <BaseNode {...props} cssClass="poo-node--abstract" stereotype="«abstract»" />
}

export function InterfaceNode(props: Props) {
  return <BaseNode {...props} cssClass="poo-node--interface" stereotype="«interface»" />
}

export function EnumNode(props: Props) {
  return <BaseNode {...props} cssClass="poo-node--enum" stereotype="«enum»" />
}

export function RecordNode(props: Props) {
  return <BaseNode {...props} cssClass="poo-node--record" stereotype="«record»" />
}

export function SealedNode(props: Props) {
  return <BaseNode {...props} cssClass="poo-node--sealed" stereotype="«sealed»" />
}

export function StructNode(props: Props) {
  return <BaseNode {...props} cssClass="poo-node--struct" stereotype="«struct»" />
}

export function ObjectNode(props: Props) {
  return <BaseNode {...props} cssClass="poo-node--object" stereotype="«object»" />
}

export function TraitNode(props: Props) {
  return <BaseNode {...props} cssClass="poo-node--trait" stereotype="«trait»" />
}

export function DataClassNode(props: Props) {
  return <BaseNode {...props} cssClass="poo-node--dataclass" stereotype="«dataclass»" />
}

export const nodeTypes = {
  class: ClassNode,
  abstract: AbstractNode,
  interface: InterfaceNode,
  enum: EnumNode,
  record: RecordNode,
  sealed: SealedNode,
  struct: StructNode,
  object: ObjectNode,
  trait: TraitNode,
  dataclass: DataClassNode,
}
