import { api } from './client'
import type { TableSchema } from '../lib/types'

export async function getSchema(table: string): Promise<TableSchema> {
  const { data } = await api.get(`/tables/${encodeURIComponent(table)}/schema`)
  return data
}

export async function updateSchema(table: string, schema: TableSchema): Promise<TableSchema> {
  const { data } = await api.put(`/tables/${encodeURIComponent(table)}/schema`, schema)
  return data
}

