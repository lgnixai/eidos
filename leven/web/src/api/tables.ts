import { api } from './client'
import type { TableSchema } from '../lib/types'

export async function listTables(): Promise<TableSchema[]> {
  const { data } = await api.get('/tables')
  return data
}

export async function createTable(schema: TableSchema): Promise<TableSchema> {
  const { data } = await api.post('/tables', schema)
  return data
}

