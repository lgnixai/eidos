import { useSqlite } from "@/hooks/use-sqlite"
import { ScriptTableName } from "@/lib/sqlite/const"
import { DataSpace } from '@/packages/core/DataSpace'
import { createReactiveData } from "./use-reactive-data"

// Define the schema for mblocks
// const mblockSchema = z.object({
//     id: z.string(),
//     name: z.string(),
//     icon: z.string().optional(),
//     type: z.literal("m_block"),
//     code: z.string(),
// })

// export type Mblock = z.infer<typeof mblockSchema>

export interface Mblock {
    id: string
    name: string
    icon?: string
    type: "m_block"
    code: string
}
// Create the reactive data store
const {
    useItemsList,
    useSyncWithBroadcast,
    useReload
} = createReactiveData<Mblock>({
    modeName: ScriptTableName,
    // schema: mblockSchema,
    list: async (sqlite: DataSpace) => {
        const blocks = await sqlite.extension.list({
            type: "m_block",
            enabled: true,
        })
        return blocks as Mblock[]
    }
})

export const useAllMblocks = () => {
    const { sqlite } = useSqlite()
    const { data: mblocks, loading } = useItemsList(sqlite)
    useSyncWithBroadcast(sqlite)
    const reload = useReload(sqlite)
    return {
        mblocks,
        reload,
        loading
    }
}
