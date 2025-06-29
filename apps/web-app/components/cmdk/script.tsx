import { ICommand, IExtension } from "@/packages/core/meta-table/extension"
import { useKeyPress } from "ahooks"
import React, { useMemo, useState } from "react"

import { useAllExtensions } from "@/apps/web-app/hooks/use-all-extensions"
import { useCurrentNode } from "@/apps/web-app/hooks/use-current-node"
import { useCurrentPathInfo } from "@/apps/web-app/hooks/use-current-pathinfo"
import { useTableViews } from "@/apps/web-app/hooks/use-table"
import { ActionExecutor } from "@/lib/action/action"

import { useScriptFunction } from "../script-container/hook"
import {
  CommandGroup,
  CommandItem,
  CommandShortcut
} from "../ui/command"

interface ScriptCommandItemsProps {
  input: string
  setInput: (input: string) => void
  setCmdkOpen: (open: boolean) => void
  mode: string
}

export const ScriptCommandItems = ({
  input,
  setInput,
  setCmdkOpen,
}: ScriptCommandItemsProps) => {
  const { callFunction } = useScriptFunction()
  const [currentAction, setCurrentAction] = useState<IExtension>()
  const [currentCommand, setCurrentCommand] = useState<ICommand>()
  const { space, tableId, viewId } = useCurrentPathInfo()
  const currentNode = useCurrentNode()
  const _scripts = useAllExtensions(space)
  const views = useTableViews(tableId!)

  const scripts = useMemo(() => {
    return _scripts.filter((script) => {
      return script.type === "script" || script.type === "py_script"
    })
  }, [_scripts])

  const onItemSelect = (action: IExtension, subCommand?: ICommand) => () => {
    const paramsString = Object.keys(
      subCommand?.inputJSONSchema?.properties || {}
    )
      .map((param) => {
        return `--${param}=`
      })
      .join(" ")
    let newInputValue = subCommand ? `/${subCommand?.name}` : `/${action.name}`
    if (paramsString.length > 0) {
      newInputValue += ` ${paramsString}`
    }
    setInput(newInputValue)
    setCurrentAction(action)
    subCommand && setCurrentCommand(subCommand)
  }

  useKeyPress("Enter", async () => {
    if (currentAction) {
      console.log("executing command: " + input)
      const realParams: Record<string, any> = ActionExecutor.getParams(input)
      const view = viewId ? views.find((v) => v.id === viewId) : views[0]
      callFunction({
        input: realParams,
        command: currentCommand?.name || "default",
        context: {
          tables: currentAction.fields_map,
          env: currentAction.env_map || {},
          currentNodeId: currentNode?.id,
          currentViewId: viewId,
          currentViewQuery: view?.query,
        },
        code: currentAction.code,
        id: currentAction.id,
        bindings: currentAction.bindings,
        type: currentAction.type,
        dependencies: currentAction.dependencies,
      }).then((res) => {
        console.log("res", res)
      })
      setInput("")
      setCmdkOpen(false)
    }
  })

  return (
    <CommandGroup heading="Scripts">
      {scripts.map((script) => {
        const hasCommands = Boolean(script.commands?.length)
        const scriptValue = `/${script.name}`
        return (
          <React.Fragment key={script.id}>
            {hasCommands ? (
              <>
                {script.commands?.map((subCommand) => {
                  const value = `/${script.name} ${subCommand.name}`
                  const showValue = `/${subCommand.name}`
                  return (
                    <CommandItem
                      onSelect={onItemSelect(script, subCommand)}
                      key={value}
                      value={value}
                    >
                      <div className="flex flex-col">
                        <div className="flex gap-1 font-semibold">
                          {showValue}
                          <div className="ml-2 flex gap-1">
                            {Object.keys(
                              subCommand.inputJSONSchema?.properties || {}
                            ).map((name) => {
                              return <span key={name}>{` ${name}`}</span>
                            })}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {subCommand.description}
                        </span>
                      </div>
                      <CommandShortcut>{script.name}</CommandShortcut>
                    </CommandItem>
                  )
                })}
              </>
            ) : (
              <CommandItem
                onSelect={onItemSelect(script)}
                key={script.id}
                value={scriptValue}
              >
                {scriptValue}
                <CommandShortcut>{script.name}</CommandShortcut>
              </CommandItem>
            )}
          </React.Fragment>
        )
      })}
    </CommandGroup>
  )
}
