import { useState } from "react"
import { IAction } from "@/packages/core/meta-table/action"

import { ActionExecutor } from "@/lib/action/action"
import { useAppRuntimeStore } from "@/lib/store/runtime-store"
import { uuidv7 } from "@/lib/utils"
import { useActions } from "@/apps/web-app/hooks/use-actions"
import { useCurrentPathInfo } from "@/apps/web-app/hooks/use-current-pathinfo"
import { useSqlite } from "@/apps/web-app/hooks/use-sqlite"

import { CommandDialogDemo } from "."
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command"
import { useInput } from "./hooks"
import { useKeyPress } from "ahooks"

interface ActionCommandItemsProps {
  input: string
  setInput: (input: string) => void
  setCmdkOpen: (open: boolean) => void
  mode: string
}

const useFunctionCall = (space: string) => {
  const { sqlite } = useSqlite(space)
  const addRow = ({ tableName, data }: { tableName: string; data: any }) => {
    const keys = ["_id", ...Object.keys(data)].join(",")
    const values = [uuidv7(), ...Object.values(data)]
    const _values = Array(values.length).fill("?").join(",")
    if (!sqlite) return
    sqlite.sql4mainThread(
      `INSERT INTO ${tableName} (${keys}) VALUES (${_values})`,
      values
    )
  }
  return {
    addRow,
  }
}

export const ActionCommandItems = ({
  input,
  setInput,
  setCmdkOpen,
}: ActionCommandItemsProps) => {
  const [currentAction, setCurrentAction] = useState<IAction>()
  const { space } = useCurrentPathInfo()
  const { addRow } = useFunctionCall(space)
  const actions = useActions(space)

  const onItemSelect = (action: IAction) => () => {
    const paramsString = action.params
      .map((param) => {
        return `--${param.name}=`
      })
      .join(" ")
    setInput(`/${action.name} ${paramsString}`)
    setCurrentAction(action)
  }

  useKeyPress("Enter", () => {
    if (currentAction) {
      console.log("executing command: " + input)
      const actionExecutor = new ActionExecutor(currentAction)
      actionExecutor.functionMap = {
        addRow,
      }
      actionExecutor.execute(input)
      setInput("")
      setCmdkOpen(false)
    }
  })

  return (
    <CommandGroup heading="Actions">
      {actions.map((action) => {
        const value = `/${action.name}`
        return (
          <CommandItem
            onSelect={onItemSelect(action)}
            key={action.id}
            value={value}
          >
            {value}
            <div className="ml-2">
              {action.params.map((param) => {
                return <span key={param.name}>{` ${param.name}`}</span>
              })}
            </div>
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}
