import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getSchema, updateSchema } from '../api/schema'
import { listRecords, appendRecord } from '../api/records'
import DataGrid from '../components/table/DataGrid'
import AddRowInline from '../components/table/AddRowInline'
import AddColumnDialog from '../components/table/AddColumnDialog'

export default function TableView() {
  const { table = '' } = useParams()
  const schemaQ = useQuery({ queryKey: ['schema', table], queryFn: () => getSchema(table), enabled: !!table })
  const recordsQ = useQuery({ queryKey: ['records', table], queryFn: () => listRecords(table), enabled: !!table })

  if (schemaQ.isLoading || recordsQ.isLoading) return <div>Loading…</div>
  if (schemaQ.error) return <div className="text-red-600">Failed to load schema</div>
  if (recordsQ.error) return <div className="text-red-600">Failed to load records</div>

  const schema = schemaQ.data!
  const [adding, setAdding] = useState(false)
  const rows = recordsQ.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{schema.name}</h1>
        <button className="px-3 h-9 rounded-md border" onClick={()=>setAdding(true)}>Add field</button>
      </div>
      <div className="overflow-hidden border rounded-lg">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0">
              <tr className="bg-muted/40">
                {schema.fields.map((f) => (
                  <th key={f.name} className="text-left px-3 py-2 font-medium whitespace-nowrap border-b">{f.name}</th>
                ))}
                <th className="w-40" />
              </tr>
            </thead>
            <tbody>
              <AddRowInline
                fields={schema.fields}
                onSubmit={async (row) => {
                  await appendRecord(schema.name, row)
                  recordsQ.refetch()
                }}
              />
            </tbody>
          </table>
        </div>
        <DataGrid tableName={schema.name} fields={schema.fields} rows={rows} />
      </div>
      <AddColumnDialog
        open={adding}
        onOpenChange={setAdding}
        onAdd={async (field) => {
          const next = { ...schema, fields: [...schema.fields, field] }
          await updateSchema(schema.name, next)
          await schemaQ.refetch()
        }}
      />
    </div>
  )
}

