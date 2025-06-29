import { useEffect, useMemo, useState } from "react"
import type { SQLNamespace } from "@codemirror/lang-sql"
import { useTranslation } from "react-i18next"

import { formatSql } from "@/packages/core/sqlite/helper"
import { shortenId } from "@/lib/utils"
import { useDataView } from "@/apps/web-app/hooks/use-data-view"
import { useSqlite } from "@/apps/web-app/hooks/use-sqlite"
import { Button } from "@/components/ui/button"
import SqlEditor from "@/components/sql-editor"

import { templates } from "./template"

export const DataViewPlaceholder = ({
  nodeId,
  onCreated,
}: {
  nodeId: string
  onCreated: () => void
}) => {
  const [sql, setSql] = useState("")
  const [schema, setSchema] = useState<SQLNamespace>({})
  const { createDataView } = useDataView()
  const { sqlite } = useSqlite()
  const { t } = useTranslation()

  useEffect(() => {
    const buildSchema = async () => {
      if (!sqlite) return

      try {
        const tables = await sqlite.sqlQuery2(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'fts_%'
        `)

        const schemaResult: SQLNamespace = {}

        for (const table of tables) {
          const tableName = table.name

          const columns = await sqlite.sqlQuery2(
            `PRAGMA table_info(${tableName})`
          )

          schemaResult[tableName] = columns.map((col: any) => col.name)
        }

        setSchema(schemaResult)
      } catch (error) {
        console.error("Error building schema:", error)
      }
    }

    buildSchema()
  }, [sqlite])

  const handleCreate = () => {
    createDataView(shortenId(nodeId), sql).then(onCreated)
  }

  const handleTemplateSelect = (templateSql: string) => {
    setSql(formatSql(templateSql))
  }

  return (
    <div className="flex h-full px-4 gap-4">
      <div className="w-72 flex-shrink-0  flex flex-col h-full">
        <label className="block text-sm font-medium text-muted-foreground mb-4 flex-shrink-0">
          {t("common.templates")}
        </label>
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto min-h-0">
          {templates.map((template) => (
            <button
              key={template.name}
              onClick={() => handleTemplateSelect(template.sql.trim())}
              className="p-2 text-left border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <div className="font-medium">{t(template.i18nKey)}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {t(template.descriptionKey)}
              </div>
              {template.tags && template.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 h-full flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-2 flex-shrink-0">
          <label
            htmlFor="sql"
            className="block text-sm font-medium text-muted-foreground"
          >
            {t("common.sqlQuery")}
          </label>
          <Button size="xs" onClick={handleCreate}>
            {t("common.createDataView")}
          </Button>
        </div>
        <div className="flex-1 min-h-0 mb-4">
          <SqlEditor value={sql} onChange={setSql} schema={schema} />
        </div>
      </div>
    </div>
  )
}
