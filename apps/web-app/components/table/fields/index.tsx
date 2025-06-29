import { useContext, useEffect } from "react"

import type { IView } from "@/packages/core/types/IView"
import { useTableOperation } from "@/apps/web-app/hooks/use-table"
import { useUiColumns } from "@/apps/web-app/hooks/use-ui-columns"
import { TableContext } from "@/components/table/hooks"

import { useTableAppStore } from "../views/grid/store"
import { FieldAppendPanel } from "./field-append-panel"
import { FieldEditorDropdown } from "./field-editor-dropdown"
import { FieldPropertyEditor } from "./field-property-editor"

interface IFieldEditorProps {
  tableName: string
  databaseName: string
  view: IView
}

export const FieldEditor = (props: IFieldEditorProps) => {
  const { tableName, databaseName } = props
  const {
    isAddFieldEditorOpen,
    isFieldPropertiesEditorOpen,
    setCurrentUiColumn,
    currentUiColumn,
  } = useTableAppStore()
  const { uiColumns } = useUiColumns(tableName, databaseName)

  useEffect(() => {
    if (currentUiColumn) {
      const newCurrentUiColumn = uiColumns.find(
        (column) =>
          column.table_column_name === currentUiColumn.table_column_name &&
          column.table_name === currentUiColumn.table_name
      )
      if (newCurrentUiColumn) {
        setCurrentUiColumn(newCurrentUiColumn)
      }
    }
  }, [uiColumns, setCurrentUiColumn, currentUiColumn])

  const { deleteField, addField, updateFieldProperty, changeFieldType } =
    useTableOperation(tableName, databaseName)
  const { isReadOnly } = useContext(TableContext)
  return (
    <>
      {isAddFieldEditorOpen && (
        <FieldAppendPanel addField={addField} uiColumns={uiColumns} />
      )}
      {isFieldPropertiesEditorOpen && (
        <FieldPropertyEditor
          updateFieldProperty={updateFieldProperty}
          changeFieldType={changeFieldType}
          databaseName={databaseName}
          tableName={tableName}
          deleteField={deleteField}
        />
      )}
      {!isReadOnly && (
        <FieldEditorDropdown
          databaseName={databaseName}
          tableName={tableName}
          view={props.view}
          deleteField={deleteField}
        />
      )}
    </>
  )
}
