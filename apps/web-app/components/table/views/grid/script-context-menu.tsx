import { ICommand, IExtension } from "@/packages/core/meta-table/extension"
import { RowsManager } from "@/packages/core/sdk/rows"

import { useAllExtensions } from "@/apps/web-app/hooks/use-all-extensions"
import { useCurrentPathInfo } from "@/apps/web-app/hooks/use-current-pathinfo"
import { useCurrentUiColumns } from "@/apps/web-app/hooks/use-ui-columns"
import {
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu"

import { useScriptFunction } from "../../../script-container/hook"

export const ScriptContextMenu = ({
  getRows,
}: {
  getRows: () => any[] | undefined
}) => {
  const { space, tableId, viewId } = useCurrentPathInfo()
  const scripts = useAllExtensions(space)
  const { callFunction } = useScriptFunction()
  const { fieldRawColumnNameFieldMap } = useCurrentUiColumns()
  const handleScriptActionCall = async (
    action: IExtension,
    command: ICommand
  ) => {
    const rows = getRows()
    if (!rows?.length) return
    for (const row of rows) {
      const rowJson = RowsManager.rawData2Json(row, fieldRawColumnNameFieldMap)
      await callFunction({
        input: {
          ...rowJson,
          _id: row._id,
        },
        command: command.name,
        context: {
          tables: action.fields_map,
          env: action.env_map || {},
          currentNodeId: tableId,
          currentRowId: row._id,
          currentViewId: viewId,
          callFromTableAction: true,
        },
        code: action.code,
        id: action.id,
      })
    }
  }
  return (
    <>
      {scripts.map((script) => {
        const actionCommands = script.commands?.filter(
          (cmd) => cmd.asTableAction
        )
        const hasActions = actionCommands && actionCommands.length > 0
        if (!hasActions) {
          return null
        }
        return (
          <ContextMenuSub key={script.id}>
            <ContextMenuSubTrigger inset>{script.name}</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              {actionCommands.map((cmd) => {
                return (
                  <ContextMenuItem
                    key={cmd.name}
                    onClick={() => {
                      handleScriptActionCall(script, cmd)
                    }}
                  >
                    {cmd.name}
                  </ContextMenuItem>
                )
              })}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )
      })}
    </>
  )
}
