import { useMemo } from "react"

import { transformQueryWithFormulaFields2Sql } from "@/packages/core/sqlite/sql-formula-parser"
import { IField } from "@/packages/core/fields/IField"

export const useTransformSqlQuery = (sql: string, fields: IField[]) => {
  return useMemo(() => {
    return transformQueryWithFormulaFields2Sql(sql, fields)
  }, [sql, fields])
}
