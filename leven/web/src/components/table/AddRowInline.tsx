import { useState } from 'react'
import type { Field, FieldType, RecordRow } from '../../lib/types'

function InputForType({ type, value, onChange }: { type: FieldType; value: unknown; onChange: (v: unknown) => void }) {
  if (type === 'boolean') {
    return <input type="checkbox" className="h-4 w-4" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
  }
  if (type === 'number') {
    return <input type="number" className="w-full h-8 px-2 rounded border bg-background" value={String(value ?? '')} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
  }
  return <input className="w-full h-8 px-2 rounded border bg-background" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
}

export default function AddRowInline({ fields, onSubmit }: { fields: Field[]; onSubmit: (row: RecordRow) => Promise<void> }) {
  const [draft, setDraft] = useState<RecordRow>({})
  const [busy, setBusy] = useState(false)

  async function handleSubmit() {
    setBusy(true)
    try {
      await onSubmit(draft)
      setDraft({})
    } finally {
      setBusy(false)
    }
  }

  return (
    <tr className="bg-accent/30">
      {fields.map((f) => (
        <td key={f.name} className="px-3 py-2">
          <InputForType type={f.type} value={draft[f.name]} onChange={(v) => setDraft((d) => ({ ...d, [f.name]: v }))} />
        </td>
      ))}
      <td className="px-3 py-2 whitespace-nowrap">
        <button disabled={busy} onClick={handleSubmit} className="px-3 h-8 rounded border bg-foreground text-background">Add</button>
      </td>
    </tr>
  )
}

