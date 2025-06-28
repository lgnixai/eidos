import { Tool } from "ai"
import { useMemo } from "react"
import { useAllScripts } from "./use-all-scripts"
import { createRecordsTool } from "./tools/table"


const builtInTools = {
    createRecords: createRecordsTool,
}
export const useAllTools = () => {
    const scripts = useAllScripts()
    const commands = scripts.filter(script => script.commands && script.commands.length > 0)
        .flatMap(script => script.commands.map(command => ({
            ...command,
            scriptId: script.id,
            script: script
        })))
    const tools = commands.filter(command => command.asTool).map(command => ({
        name: command.name,
        description: command.description,
        parameters: command.inputJSONSchema,
        scriptId: command.scriptId,
    }))

    // use memo to avoid re-rendering
    const _tools = useMemo(() => tools.reduce((acc, tool) => {
        acc[tool.name] = {
            description: tool.description,
            parameters: tool.parameters,
            id: `${tool.scriptId}.${tool.name}` as `${string}.${string}`,
        }
        return acc
    }, builtInTools as Record<string, Tool>), [tools])

    return _tools
}