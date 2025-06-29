import { useEffect } from "react"

import { ViewTypeEnum } from "@/packages/core/types/IView"
import { useSqliteTableSubscribe } from "@/apps/web-app/hooks/use-sqlite-table-subscribe"
import { useUiColumns } from "@/apps/web-app/hooks/use-ui-columns"

import { FieldEditor } from "./fields"
import { TABLE_CONTENT_ELEMENT_ID } from "./helper"
import { TableContext, useCurrentView, useUDFs } from "./hooks"
import { ViewToolbar } from "./view-toolbar"
import { DocListView } from "./views/doc-list"
import GalleryView from "./views/gallery"
import GridView from "./views/grid"
import { GridViewForView } from "./views/grid/grid-for-view"
import KanbanView from "./views/kanban"

// const GalleryView = React.lazy(() => import("./views/gallery"))

interface ITableProps {
  space: string
  tableName: string
  viewId?: string
  isEmbed?: boolean
  isEditable?: boolean
  isReadOnly?: boolean
}

export const Table = ({
  tableName,
  space,
  viewId,
  isEmbed,
  isEditable,
  isReadOnly,
}: ITableProps) => {
  const { currentView } = useCurrentView({
    space,
    tableName,
    viewId,
  })
  const udfs = useUDFs()

  const isView = tableName.startsWith("vw_")
  const { updateUiColumns } = useUiColumns(tableName, space)
  useEffect(() => {
    updateUiColumns(tableName)
  }, [updateUiColumns, tableName])

  useSqliteTableSubscribe(tableName)
  return (
    <TableContext.Provider
      value={{
        tableName,
        space,
        viewId: currentView?.id || viewId,
        isReadOnly,
        isView,
        udfs,
      }}
    >
      <div className="h-full w-full overflow-hidden p-2 pt-0 flex flex-col">
        <ViewToolbar
          tableName={tableName}
          space={space}
          isEmbed={Boolean(isEmbed)}
          isReadOnly={isReadOnly}
        />
        <div
          className="relative flex-grow overflow-hidden"
          id={TABLE_CONTENT_ELEMENT_ID}
        >
          {currentView?.type === ViewTypeEnum.Grid &&
            (isView ? (
              <GridViewForView
                tableName={tableName!}
                databaseName={space}
                view={currentView}
                isEmbed={isEmbed}
              />
            ) : (
              <GridView
                tableName={tableName}
                databaseName={space}
                view={currentView}
                isEmbed={isEmbed}
              />
            ))}
          {currentView?.type === ViewTypeEnum.Gallery && (
            <GalleryView
              space={space}
              tableName={tableName}
              view={currentView}
            />
          )}
          {currentView?.type === ViewTypeEnum.Kanban && (
            <KanbanView
              space={space}
              tableName={tableName}
              view={currentView}
            />
          )}
          {currentView?.type === ViewTypeEnum.DocList && (
            <DocListView
              space={space}
              tableName={tableName}
              view={currentView}
            />
          )}
          <FieldEditor
            tableName={tableName}
            databaseName={space}
            view={currentView}
          />
        </div>
      </div>
    </TableContext.Provider>
  )
}
