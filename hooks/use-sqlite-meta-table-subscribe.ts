import { useEffect } from "react"

import {
  DataUpdateSignalType,
  EidosDataEventChannelMsg,
  EidosDataEventChannelMsgType,
  EidosDataEventChannelName,
} from "@/lib/const"
import { ScriptTableName, TreeTableName } from "@/lib/sqlite/const"
import { ITreeNode } from "@/lib/store/ITreeNode"

import { useSqliteStore } from "./use-sqlite"
import { isDesktopMode } from "@/lib/env"
import { toast } from "@/components/ui/use-toast"

export const useSqliteMetaTableSubscribe = () => {
  const { addNode } = useSqliteStore()

  useEffect(() => {
    const bc = new BroadcastChannel(EidosDataEventChannelName)
    const handler = async (ev: MessageEvent<EidosDataEventChannelMsg>) => {
      const { type, payload } = ev.data
      if (type === EidosDataEventChannelMsgType.MetaTableUpdateSignalType) {
        const { table, _new, _old } = payload
        switch (payload.type) {
          case DataUpdateSignalType.Insert:
            if (table === TreeTableName) {
              addNode(_new as any as ITreeNode)
            }
            break
          default:
            break
        }
        if (table === ScriptTableName) {
          const type = _new.type || _old.type
          if (type !== 'udf') {
            return
          }
          const diff = Object.keys(_new).filter((key) => {
            return _new[key] !== _old[key]
          })
          if (diff.includes('enabled') || diff.includes('code')) {
            if (isDesktopMode) {
              const { success } = await window.eidos.invoke("reload-data-space")
              const { success: success2 } = await window.eidos.invoke("reload-query-worker")
              const reloadDone = success && success2
              if (!reloadDone) {
                toast({
                  title: "Reload compute engine failed",
                  description: "Changing UDF may cause some table calculations to fail",
                })
              }
            }
          }
        }
      }
    }
    bc.addEventListener("message", handler)
    return () => {
      bc.removeEventListener("message", handler)
    }
  }, [addNode])
}
