export type FieldType = 'string' | 'number' | 'boolean'

export interface Field {
  name: string
  type: FieldType
}

export interface TableSchema {
  name: string
  fields: Field[]
}

export type RecordRow = Record<string, unknown>

