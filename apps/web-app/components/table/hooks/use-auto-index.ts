import { useEffect } from "react"

import { useSqlite } from "@/apps/web-app/hooks/use-sqlite"
import { getSortColumns } from "@/packages/core/sqlite/sql-sort-parser"
import { IView } from "@/packages/core/types/IView"

import { getRawTableNameFromQuery } from "@/packages/core/sqlite/sql-parser"
import { DataLevel, getDataLevel } from "../helper"
import { useTableCount } from "./use-table-count"

export const useAutoIndex = (view: IView) => {
  const rawTableName = getRawTableNameFromQuery(view.query)
  const { count } = useTableCount(rawTableName)
  const dataLevel = getDataLevel(count)
  const { sqlite } = useSqlite()

  useEffect(() => {
    if (!sqlite) return
    if (dataLevel > DataLevel.L2) {
      const columns = getSortColumns(view.query)
      // const filterColumns = getFilterColumns(view.query)
      for (const column of columns || []) {
        sqlite.createTableIndex(view.table_id, column)
      }
      // for (const column of filterColumns || []) {
      //   sqlite.createTableIndex(view.table_id, column)
      // }
    }
  }, [dataLevel, sqlite, view.query, view.table_id])
}
