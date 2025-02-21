import { useScriptFunction } from "@/components/script-container/hook"
import { useSqlite } from "./use-sqlite"

export const useScriptData = () => {
    const { callFunction } = useScriptFunction()
    const { sqlite } = useSqlite()

    const getScriptData = async (scriptId: string) => {
        if (!sqlite) {
            throw new Error("Sqlite not found")
        }
        const script = await sqlite?.script.get(scriptId)
        if (!script) {
            throw new Error("Script not found")
        }
        const data = await callFunction({
            input: {},
            command: "data",
            context: {
                tables: script.fields_map,
                env: script.env_map || {},
            },
            code: script.code,
            id: script.id,
            bindings: script.bindings,
            type: script.type,
            dependencies: script.dependencies,
        })
        return data
    }

    return {
        getScriptData
    }
}