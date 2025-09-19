import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

export interface ColumnDndHeaderProps {
  columnId: string
  children: React.ReactNode
}

export function ColumnDndHeader({ columnId, children }: ColumnDndHeaderProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: columnId })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `drop-${columnId}` })
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div ref={setDropRef} className={`relative ${isOver ? 'bg-accent/40' : ''}`}>
      <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`flex items-center gap-2 select-none ${isDragging ? 'opacity-50' : ''}`}>
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="truncate">{children}</span>
      </div>
    </div>
  )
}

