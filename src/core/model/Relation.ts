export type RelationType = 'extends' | 'implements' | 'field' | 'parameter' | 'returns' | 'creates'

export interface Relation {
  source: string
  target: string
  type: RelationType
}
