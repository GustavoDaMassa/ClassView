export type ElementType =
  | 'class'
  | 'abstract'
  | 'interface'
  | 'enum'
  | 'record'
  | 'sealed'
  | 'struct'
  | 'object'
  | 'trait'
  | 'dataclass'

export type Language = 'java' | 'kotlin' | 'csharp' | 'typescript' | 'python' | 'php' | 'ruby'

export interface Attribute {
  visibility: '+' | '-' | '#' | '~'
  name: string
  type: string
}

export interface Method {
  visibility: '+' | '-' | '#' | '~'
  name: string
  params: string
  returnType: string
}

export interface CodeElement {
  id: string
  name: string
  type: ElementType
  language: Language
  attributes: Attribute[]
  methods: Method[]
  filePath: string
}
