import React from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ToyBrickIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"

import { useExtensionByIdOrSlug } from "@/hooks/use-extension"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useCurrentPathInfo } from "@/apps/web-app/hooks/use-current-pathinfo"
import { useFavBlocks } from "@/apps/web-app/hooks/use-fav-blocks"

import { IconRenderer } from "../ui/icon-picker"

interface SortableItemProps {
  id: string
  mblock: any
  space: string
  onRemoveFav: (blockId: string, e: React.MouseEvent) => void
  isCurrentBlock?: boolean
}

const BlockIcon = ({ id }: { id: string }) => {
  const extension = useExtensionByIdOrSlug(id)

  if (!extension) return null
  if (!extension.icon) return <ToyBrickIcon className="w-6 h-6" />
  if (extension.icon.startsWith("data:image")) {
    return (
      <img
        src={extension.icon}
        alt="block icon"
        className="w-6 h-6 rounded object-cover"
      />
    )
  }
  return <IconRenderer name={extension.icon as any} />
}

const SortableItem = ({
  id,
  mblock,
  space,
  onRemoveFav,
  isCurrentBlock = false,
}: SortableItemProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
      e.stopPropagation()
      return
    }

    navigate(`/${space}/blocks/${mblock.id}`)
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="touch-none">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="group block cursor-pointer" onClick={handleClick}>
            <div
              className={`relative w-full aspect-[2/1] rounded-md bg-secondary flex items-center justify-center overflow-hidden transition-all duration-200 hover:ring-1 hover:scale-105 ${
                isCurrentBlock ? "ring-1 ring-primary" : ""
              }`}
              {...listeners}
            >
              {/* Subtle background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-100/20 dark:to-gray-800/20"></div>

              {/* Icon container */}
              <div className="relative z-10 pointer-events-none">
                <BlockIcon id={mblock.id} />
              </div>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem asChild>
            <Link to={`/${space}/extensions/${mblock.id}`}>
              {t("common.viewDetails")}
            </Link>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={(e) => onRemoveFav(mblock.id, e)}
            className="text-destructive focus:text-destructive"
          >
            {t("common.remove")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
}

export const MicroBlocksGrid = () => {
  const { space } = useCurrentPathInfo()
  const { blockId } = useParams()
  const { favBlocks, removeFavBlock, reorderFavBlocks } = useFavBlocks()
  const { t } = useTranslation()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  if (favBlocks.length === 0) {
    return null
  }

  const handleRemoveFav = (blockId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    removeFavBlock(blockId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = favBlocks.findIndex((item) => item.id === active.id)
      const newIndex = favBlocks.findIndex((item) => item.id === over.id)

      const newOrder = arrayMove(favBlocks, oldIndex, newIndex)
      reorderFavBlocks(newOrder)
    }
  }

  const getGridCols = () => {
    const count = favBlocks.length
    if (count <= 2) return "grid-cols-2"
    if (count <= 9) return "grid-cols-3"
    return "grid-cols-4"
  }

  const items = favBlocks.map((item) => item.id)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div className={`grid ${getGridCols()} gap-3 p-2`}>
          {favBlocks.map((mblock) => (
            <SortableItem
              key={mblock.id}
              id={mblock.id}
              mblock={mblock}
              space={space}
              onRemoveFav={handleRemoveFav}
              isCurrentBlock={blockId === mblock.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
