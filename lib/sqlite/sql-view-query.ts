import { SelectFromStatement, astMapper, parseFirst, toSql } from "pgsql-ast-parser"
import { getFilterColumns } from "./sql-filter-parser"
import { getSortColumns } from "./sql-sort-parser"

const getQueryFields = (query: string) => {
  const filterColumns = getFilterColumns(query)
  const sortColumns = getSortColumns(query)
  return Array.from(new Set([...filterColumns, ...(sortColumns || [])]))
}

export const isFieldsInQuery = (query: string, fields: string[]) => {
  const queryFields = getQueryFields(query)
  return fields.some((f) => queryFields?.includes(f))
}


export const rewriteQueryWithRowId = (query: string) => {
  const ast = parseFirst(query) as SelectFromStatement

  const mapper = astMapper((map) => ({
    ref: (t) => {
      if (t.name === "*") {
        return {
          ...t,
          name: "rowid",
        }
      }
      return map.super().ref(t)
    },
  }))

  const modified = mapper.statement(ast) as SelectFromStatement
  return toSql.statement(modified)
}