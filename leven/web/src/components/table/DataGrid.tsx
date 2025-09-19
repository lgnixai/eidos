import { useMemo, useState, useEffect } from 'react'
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  ColumnResizeMode,
  VisibilityState,
} from '@tanstack/react-table'
import type { Field, RecordRow } from '../../lib/types'
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { ColumnDndHeader } from './ColumnDndHeader'
import { updateSchema } from '../../api/schema'

function getLocalWidthKey(tableName: string, columnName: string) {
  return `leven.width.${tableName}.${columnName}`
}

export interface DataGridProps {
  tableName: string
  fields: Field[]
  rows: RecordRow[]
}

export default function DataGrid({ tableName, fields, rows }: DataGridProps) {
  const [currentFields, setCurrentFields] = useState<Field[]>(fields)
  useEffect(() => setCurrentFields(fields), [fields])

  const columns = useMemo<ColumnDef<RecordRow>[]>(() => {
    return currentFields.map((f) => ({
      id: f.name,
      header: () => <ColumnDndHeader columnId={f.name}>{f.name}</ColumnDndHeader>,
      accessorFn: (row) => row[f.name],
      cell: (ctx) => {
        const v = ctx.getValue<any>()
        return <span>{typeof v === 'boolean' ? (v ? '✓' : '') : String(v ?? '')}</span>
      },
      size: Number(localStorage.getItem(getLocalWidthKey(tableName, f.name))) || 180,
      minSize: 80,
      maxSize: 640,
    }))
  }, [currentFields, tableName])

  const [columnVisibility] = useState<VisibilityState>({})
  const [columnResizeMode] = useState<ColumnResizeMode>('onEnd')

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode,
    state: { columnVisibility },
    onColumnSizingChange: () => {
      for (const c of table.getAllLeafColumns()) {
        const w = c.getSize()
        localStorage.setItem(getLocalWidthKey(tableName, c.id), String(w))
      }
    },
  })

  function handleDragEnd(e: DragEndEvent) {
    const activeId = e.active.id as string
    const overId = (e.over?.id as string)?.replace(/^drop-/, '')
    if (!activeId || !overId || activeId === overId) return
    const oldIndex = currentFields.findIndex((f) => f.name === activeId)
    const newIndex = currentFields.findIndex((f) => f.name === overId)
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = arrayMove(currentFields, oldIndex, newIndex)
    setCurrentFields(reordered)
    // Persist schema order to backend (name and type only)
    updateSchema(tableName, { name: tableName, fields: reordered }).catch(() => {
      // on error, revert
      setCurrentFields(currentFields)
    })
  }

  return (
    <div className="overflow-auto">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <table className="min-w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="bg-muted/40">
              {hg.headers.map((h) => (
                <th key={h.id} colSpan={h.colSpan} style={{ width: h.getSize() }} className="relative text-left px-3 py-2 font-medium whitespace-nowrap border-b">
                  {h.isPlaceholder ? null : h.column.columnDef.header as any}
                  {h.column.getCanResize() && (
                    <div
                      onMouseDown={h.getResizeHandler()}
                      onTouchStart={h.getResizeHandler()}
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none opacity-50 hover:opacity-100"
                    />
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} style={{ width: cell.column.getSize() }} className="px-3 py-2 align-top">
                  {cell.renderCell()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </DndContext>
    </div>
  )
}

