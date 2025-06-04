import { useSqlite } from "@/hooks/use-sqlite"
import { ScriptTableName } from "@/lib/sqlite/const"
import { DataSpace } from '@/worker/web-worker/DataSpace'
import { z } from 'zod'
import { createReactiveData } from "./use-reactive-data"

// Define the schema for external nodes
const extNodeSchema = z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string().optional(),
    type: z.literal("ext_node"),
    ext_node_type: z.string(),
    ext_node_handle_block_id: z.string(),
})

// Define the ExtNode type that explicitly extends BaseReactiveData
interface ExtNode {
    id: string
    name: string
    icon?: string
    type: "ext_node"
    ext_node_type: string
    ext_node_handle_block_id: string
}

// Create the reactive data store
const {
    useItemsList,
    useSyncWithBroadcast,
    useReload
} = createReactiveData<ExtNode>({
    modeName: ScriptTableName,
    // schema: extNodeSchema,
    list: async (sqlite: DataSpace) => {
        const nodes = await sqlite.extension.list({
            type: "ext_node",
            enabled: true,
        })
        return nodes as ExtNode[]
    }
})

export const useAllExtNodes = () => {
    const { sqlite } = useSqlite()
    const { data: extNodes, loading } = useItemsList(sqlite)
    useSyncWithBroadcast(sqlite)
    const reload = useReload(sqlite)
    return {
        extNodes,
        reload,
        loading
    }
}
