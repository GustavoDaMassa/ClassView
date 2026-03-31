export type RelationType = 'extends' | 'implements' | 'depends'

export interface Relation {
  source: string
  target: string
  type: RelationType
}
