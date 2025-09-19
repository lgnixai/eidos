import { useState } from 'react'
import type { Field, FieldType } from '../../lib/types'

const FIELD_TYPES: FieldType[] = ['string', 'number', 'boolean']

export default function AddColumnDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (v: boolean) => void; onAdd: (field: Field) => Promise<void> }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<FieldType>('string')
  const [busy, setBusy] = useState(false)

  async function handleAdd() {
    if (!name.trim()) return
    setBusy(true)
    try {
      await onAdd({ name: name.trim(), type })
      setName('')
      setType('string')
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg w-full max-w-md p-4 space-y-4">
        <div className="text-lg font-medium">Add field</div>
        <div className="space-y-2">
          <label className="text-sm">Field name</label>
          <input className="w-full h-9 px-3 rounded-md border bg-background" value={name} onChange={(e)=>setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm">Type</label>
          <select className="w-full h-9 px-2 rounded-md border bg-background" value={type} onChange={(e)=>setType(e.target.value as FieldType)}>
            {FIELD_TYPES.map(ft => <option key={ft} value={ft}>{ft}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-3 h-9 rounded-md border" onClick={()=>onOpenChange(false)}>Cancel</button>
          <button disabled={busy} className="px-3 h-9 rounded-md border bg-foreground text-background" onClick={handleAdd}>Add</button>
        </div>
      </div>
    </div>
  )
}

