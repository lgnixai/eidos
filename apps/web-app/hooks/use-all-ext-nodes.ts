import { useSqlite } from "@/apps/web-app/hooks/use-sqlite"
import type { EidosDataEventChannelMsg} from "@/lib/const";
import { DataUpdateSignalType, EidosDataEventChannelMsgType, EidosDataEventChannelName } from "@/lib/const"
import { ScriptTableName } from "@/packages/core/sqlite/const"
import type { IExtension } from "@/packages/core/meta-table/extension"
import { useCallback, useEffect } from "react"
import { create } from "zustand"



const useExtNodeStore = create<{
    extNodes: IExtension[]
    loading: boolean
    setExtNodes: (nodes: IExtension[]) => void
    setLoading: (loading: boolean) => void
}>((set) => ({
    extNodes: [],
    loading: false,
    setExtNodes: (nodes) => set({ extNodes: nodes }),
    setLoading: (loading) => set({ loading }),
}))

export const useSyncExtNodes = () => {
    const { sqlite } = useSqlite()
    const { setExtNodes, setLoading } = useExtNodeStore()

    const reload = useCallback(async () => {
        setLoading(true)
        if (!sqlite) return
        const nodes = await sqlite.extension.list({
            type: "ext_node",
            enabled: true,
        }, {
            fields: ["id", "name", "icon", "ext_node_type", "ext_node_handle_block_id", "enabled", "created_at", "updated_at"]
        })
        setExtNodes(nodes)
        setLoading(false)
    }, [sqlite, setExtNodes, setLoading])


    useEffect(() => {
        reload()
    }, [reload])

    useEffect(() => {
        const bc = new BroadcastChannel(EidosDataEventChannelName)

        const handler = async (ev: MessageEvent<EidosDataEventChannelMsg>) => {
            const { type, payload } = ev.data
            if (type === EidosDataEventChannelMsgType.MetaTableUpdateSignalType) {
                const { table, _new, _old, type: updateType } = payload
                if (table !== ScriptTableName || (_old?.type !== "ext_node" || _new?.type !== "ext_node")) return

                switch (updateType) {
                    case DataUpdateSignalType.Insert:
                        reload()
                        break

                    case DataUpdateSignalType.Update:
                        reload()
                        break

                    case DataUpdateSignalType.Delete:
                        reload()
                        break
                    default:
                        break
                }
            }
        }

        bc.addEventListener("message", handler)
        return () => {
            bc.removeEventListener("message", handler)
            bc.close()
        }
    }, [reload])

}

export const useAllExtNodes = () => {
    const { sqlite } = useSqlite()
    const { extNodes, loading, setExtNodes, setLoading } = useExtNodeStore()

    const reload = useCallback(async () => {
        setLoading(true)
        if (!sqlite) return
        const nodes = await sqlite.extension.list({
            type: "ext_node",
            enabled: true,
        })
        setExtNodes(nodes)
        setLoading(false)
    }, [sqlite, setExtNodes, setLoading])

    return {
        extNodes,
        reload,
        loading
    }
}
