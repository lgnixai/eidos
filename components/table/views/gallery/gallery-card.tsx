import { MoveDiagonalIcon, MoveUpRightIcon, Trash2Icon } from "lucide-react"

import { useRowDataOperation } from "@/components/doc-property/hook"
import { ScriptContextMenu } from "@/components/table/views/grid/script-context-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCurrentSubPage } from "@/hooks/use-current-sub-page"
import { useGoto } from "@/hooks/use-goto"
import { useSqlite, useSqliteStore } from "@/hooks/use-sqlite"
import { IField } from "@/lib/store/interface"
import {
  shortenId
} from "@/lib/utils"

import { CellEditor } from "../../cell-editor"
import { GalleryCardCover } from "../shared/card-cover"
import { IGalleryViewProperties } from "./properties"
import { DataCard } from "@/components/table/views/shared/data-card"

interface ICardProps<T> {
  columnIndex: number
  rowIndex: number
  style: React.CSSProperties
  data: T
}

export interface IGalleryCardProps {
  properties?: IGalleryViewProperties
  items: string[]
  columnCount: number
  uiColumns: IField[]
  showFields: IField[]
  uiColumnMap: Map<string, IField>
  rawIdNameMap: Map<string, string>
  tableId: string
  space: string
  hiddenFieldIcon?: boolean
  hiddenField?: boolean
  hiddenFields?: string[]
}

export const GalleryCard = ({
  columnIndex,
  rowIndex,
  style,
  data,
}: ICardProps<IGalleryCardProps>) => {
  const {
    items,
    columnCount,
    uiColumns,
    showFields,
    uiColumnMap,
    rawIdNameMap,
    tableId,
    space,
    hiddenFields,
    properties,
  } = data

  const rowId = items[rowIndex * columnCount + columnIndex]
  const { getRowById } = useSqliteStore()
  const item = getRowById(tableId, rowId)
  const coverField = properties?.coverPreview?.startsWith("cl_")
    ? (uiColumns as IField[]).find(
        (c) => c.table_column_name === properties?.coverPreview
      )
    : undefined

  if (!item) {
    return <div style={style}></div>
  }

  return (
    <DataCard
      item={item}
      coverField={coverField}
      rawIdNameMap={rawIdNameMap}
      style={style}
      hiddenFields={hiddenFields}
      properties={properties}
      showFields={showFields}
      tableId={tableId}
      space={space}
      uiColumnMap={uiColumnMap}
      padding={8}
      cardClassName="h-full rounded-md border-t shadow-md dark:border-gray-800 dark:bg-gray-800"
    />
  )
}
