import { api } from './client'
import type { RecordRow } from '../lib/types'

export async function listRecords(table: string): Promise<RecordRow[]> {
  const { data } = await api.get(`/tables/${encodeURIComponent(table)}/records`)
  return data
}

export async function appendRecord(table: string, row: RecordRow): Promise<RecordRow> {
  const { data } = await api.post(`/tables/${encodeURIComponent(table)}/records`, row)
  return data
}

