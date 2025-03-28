"use client"

import { memo, useMemo, useRef } from "react"
import { useVirtualList } from "ahooks"
import { useTheme } from "next-themes"

import { SelectField } from "@/lib/fields/select"
import { IField } from "@/lib/store/interface"
import { cn } from "@/lib/utils"
import {
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanBoard as OriginKanbanBoard,
} from "@/components/ui/kibo-ui/kanban"
import { DataCard } from "@/components/table/views/shared/data-card"

import { IGalleryViewProperties } from "../gallery/properties"
import { computeCardHeight } from "../gallery/utils"
import { KanbanItem, StatusCount } from "./hooks"
import { IKanbanViewProperties } from "./properties"

export const KanbanBoard = memo(
  ({
    status,
    items,
    showFields,
    uiColumnMap,
    rawIdNameMap,
    tableId,
    space,
    properties,
    hiddenFields,
  }: {
    status: StatusCount
    items: KanbanItem[]
    showFields: IField[]
    uiColumnMap: Map<string, IField>
    rawIdNameMap: Map<string, string>
    tableId: string
    space: string
    properties?: IGalleryViewProperties & IKanbanViewProperties
    hiddenFields?: string[]
  }) => {
    const containerRef = useRef(null)
    const wrapperRef = useRef(null)
    const cardHeight = computeCardHeight(showFields.length)
    const { theme } = useTheme()

    const memoizedItems = useMemo(() => items || [], [items])

    const [list] = useVirtualList(memoizedItems, {
      containerTarget: containerRef,
      wrapperTarget: wrapperRef,
      itemHeight: (index) => {
        const item = items[index]
        if (!item) {
          return 0
        }
        if (!properties?.coverPreview) {
          return cardHeight - 200
        }
        return cardHeight
      },
      overscan: 10,
    })
    const bgColor = SelectField.getColorValue(
      status.color || "gray",
      theme === "dark" ? "dark" : "light",
      0.2
    )
    const cardWidth =
      properties?.cardSize === "small"
        ? "min-w-[300px]"
        : properties?.cardSize === "medium"
        ? "min-w-[350px]"
        : "min-w-[400px]"

    return (
      <OriginKanbanBoard
        id={status.status}
        className={cn("flex flex-col", cardWidth)}
        style={{
          backgroundColor: bgColor,
        }}
      >
        <KanbanHeader
          name={`${status.status} (${status.count})`}
          color={status.color || "gray"}
        />
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden"
          ref={containerRef}
        >
          <KanbanCards ref={wrapperRef}>
            {list.map(({ data: item, index }) => (
              <KanbanCard
                key={item.id}
                id={item.id}
                name={item.title || item.name || item.id}
                parent={status.status}
                index={index}
                className={`h-[${cardHeight}px`}
              >
                <DataCard
                  key={item.id}
                  item={item}
                  showFields={showFields}
                  uiColumnMap={uiColumnMap}
                  rawIdNameMap={rawIdNameMap}
                  tableId={tableId}
                  space={space}
                  properties={properties}
                  hideCover={!properties?.coverPreview}
                  hiddenFields={hiddenFields}
                  style={{ padding: 0 }}
                />
              </KanbanCard>
            ))}
          </KanbanCards>
        </div>
      </OriginKanbanBoard>
    )
  }
)
