import { useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import { MoveDiagonalIcon, MoveUpRightIcon, Trash2Icon } from "lucide-react"

import { IField } from "@/lib/store/interface"
import { cn, shortenId } from "@/lib/utils"
import { useCurrentSubPage } from "@/hooks/use-current-sub-page"
import { useGoto } from "@/hooks/use-goto"
import { useSqlite } from "@/hooks/use-sqlite"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ScriptContextMenu } from "@/components/table/views/grid/script-context-menu"

import { useRowDataOperation } from "../../../doc-property/hook"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../ui/tooltip"
import { CellEditor } from "../../cell-editor"
import { IGalleryViewProperties } from "../gallery/properties"
import { GalleryCardCover } from "./card-cover"

interface DataCardProps {
  item: Record<string, any>
  coverField?: IField
  rawIdNameMap: Map<string, string>
  style?: React.CSSProperties
  hiddenFields?: string[]
  properties?: IGalleryViewProperties
  showFields: IField[]
  tableId: string
  space: string
  uiColumnMap: Map<string, IField>
  padding?: number
  cardClassName?: string
  hideCover?: boolean
}

export const DataCard = ({
  item,
  coverField,
  rawIdNameMap,
  style,
  hiddenFields,
  properties,
  showFields,
  tableId,
  space,
  uiColumnMap,
  padding,
  cardClassName,
  hideCover,
}: DataCardProps) => {
  const goto = useGoto()
  const { setProperty } = useRowDataOperation()
  const { getOrCreateTableSubDoc } = useSqlite()

  const { setSubPage } = useCurrentSubPage()

  if (!item) {
    return <div style={style}></div>
  }
  const handleChange = (column: string, value: any) => {
    setProperty(tableId, item._id, {
      [column]: value,
    })
  }

  const openRow = async (right?: boolean) => {
    if (!item) {
      return
    }
    const shortId = shortenId(item._id)

    await getOrCreateTableSubDoc({
      docId: shortId,
      title: item.title,
      tableId: tableId!,
    })

    if (right) {
      setSubPage(shortId)
    } else {
      goto(space, shortId)
    }
  }

  const fieldKeys = showFields
    .filter(
      (k) => k.table_column_name != "_id" && k.table_column_name != "title"
    )
    .map((k) => k.table_column_name)
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          style={style}
          className={cn({
            [`p-[${padding}px]`]: padding,
          })}
        >
          <div className={cardClassName}>
            {!hideCover && (
              <div className="flex h-[200px] w-full items-center border-b">
                <GalleryCardCover
                  item={item}
                  coverField={coverField}
                  coverPreview={properties?.coverPreview || ""}
                  fitContent={properties?.fitContent}
                  rawIdNameMap={rawIdNameMap}
                />
              </div>
            )}
            <div className="prose p-[8px] dark:prose-invert">
              <div
                className="h-[36px] truncate font-medium"
                title={item?.title}
              >
                {item?.title || <span className=" opacity-70">Untitled</span>}
              </div>
              {fieldKeys
                .filter((k) => !hiddenFields?.includes(k))
                .map((k) => {
                  const fieldName = rawIdNameMap.get(k)!
                  const uiColumn = uiColumnMap.get(fieldName) as IField
                  if (!uiColumn) {
                    return null
                  }
                  const value = item[k]
                  if (!value && properties?.hideEmptyFields) return null
                  return (
                    <TooltipProvider>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <div
                            key={`${item._id}:${k}`}
                            className="flex w-full items-center gap-2"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <CellEditor
                              field={uiColumn}
                              value={value}
                              onChange={(_value) => {
                                if (value != _value) {
                                  handleChange(
                                    uiColumn.table_column_name,
                                    _value
                                  )
                                }
                              }}
                              className="flex h-8 w-full min-w-[100px] cursor-pointer items-center rounded-sm px-1 hover:bg-none"
                              disableTextBaseEditor
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" sideOffset={8} className="">
                          {uiColumn.name}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent
        className="w-64"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <ContextMenuItem
          onClick={(e) => {
            console.log("openRow", e)
            openRow(true)
          }}
        >
          <MoveUpRightIcon className="pr-2" />
          Open
        </ContextMenuItem>
        <ContextMenuItem onClick={() => openRow()}>
          <MoveDiagonalIcon className="pr-2" />
          Open in full page
        </ContextMenuItem>
        <ContextMenuItem disabled>
          <Trash2Icon className="pr-2" />
          Delete
        </ContextMenuItem>
        <ScriptContextMenu getRows={() => [item]} />
      </ContextMenuContent>
    </ContextMenu>
  )
}
