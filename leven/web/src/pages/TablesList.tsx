import { useQuery } from '@tanstack/react-query'
import { listTables, createTable } from '../api/tables'
import type { Field, FieldType, TableSchema } from '../lib/types'
import { useState } from 'react'

const FIELD_TYPES: FieldType[] = ['string', 'number', 'boolean']

export default function TablesList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tables'],
    queryFn: listTables,
  })

  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [fields, setFields] = useState<Field[]>([])

  const onAddField = () => setFields((f) => [...f, { name: '', type: 'string' }])
  const onCreate = async () => {
    const schema: TableSchema = { name: name.trim(), fields: fields.filter(f => f.name.trim()) }
    if (!schema.name) return
    await createTable(schema)
    setIsCreating(false)
    setName('')
    setFields([])
    refetch()
  }

  if (isLoading) return <div>Loading…</div>
  if (error) return <div className="text-red-600">Failed to load tables</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tables</h1>
        <button className="px-3 h-9 rounded-md border" onClick={() => setIsCreating(true)}>New table</button>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data ?? []).map((t) => (
          <li key={t.name} className="border rounded-lg p-4 hover:bg-accent/30">
            <a href={`/t/${encodeURIComponent(t.name)}`} className="font-medium">{t.name}</a>
            <div className="text-sm text-muted-foreground">{t.fields.length} fields</div>
          </li>
        ))}
      </ul>

      {isCreating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg w-full max-w-xl p-4 space-y-4">
            <div className="text-lg font-medium">Create table</div>
            <div className="space-y-2">
              <label className="text-sm">Name</label>
              <input className="w-full h-9 px-3 rounded-md border bg-background" value={name} onChange={e => setName(e.target.value)} placeholder="Table name" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm">Fields</div>
                <button className="px-2 h-8 rounded border" onClick={onAddField}>Add field</button>
              </div>
              <div className="space-y-2">
                {fields.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="flex-1 h-9 px-3 rounded-md border bg-background" value={f.name} onChange={e => setFields(prev => prev.map((pf,pi)=> pi===i?{...pf, name:e.target.value}:pf))} placeholder="Field name" />
                    <select className="w-40 h-9 px-2 rounded-md border bg-background" value={f.type} onChange={e => setFields(prev => prev.map((pf,pi)=> pi===i?{...pf, type:e.target.value as FieldType}:pf))}>
                      {FIELD_TYPES.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 h-9 rounded-md border" onClick={()=>{setIsCreating(false);setName('');setFields([])}}>Cancel</button>
              <button className="px-3 h-9 rounded-md border bg-foreground text-background" onClick={onCreate}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

