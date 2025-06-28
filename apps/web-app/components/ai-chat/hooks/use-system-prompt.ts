import { useMap } from "ahooks"
import { useEffect, useMemo, useState } from "react"

import { useRemixPrompt } from "@/apps/web-app/pages/[database]/extensions/hooks/use-remix-prompt"
import { useCurrentExtension, useCurrentNode } from "@/apps/web-app/hooks/use-current-node"
import { useCurrentPathInfo } from "@/apps/web-app/hooks/use-current-pathinfo"
import { useDocEditor } from "@/apps/web-app/hooks/use-doc-editor"
import { useSqlite } from "@/apps/web-app/hooks/use-sqlite"
import { ITreeNode } from "@/lib/store/ITreeNode"
import { getRawTableNameById, getTableIdByRawTableName } from "@/lib/utils"
import systemPromptRaw from "./prompt.md?raw"

import docPluginPrompt from "@/packages/v3/prompts/built-in-remix-prompt-for-doc-plugin.md?raw"
import builtInRemixPromptForPrompt from "@/packages/v3/prompts/built-in-remix-prompt-for-prompt.md?raw"
import pythonScriptPrompt from "@/packages/v3/prompts/built-in-remix-prompt-for-python-script.md?raw"
import scriptPrompt from "@/packages/v3/prompts/built-in-remix-prompt-for-script.md?raw"
import builtInRemixPromptForUDF from "@/packages/v3/prompts/built-in-remix-prompt-for-udf.md?raw"
import builtInRemixPrompt from "@/packages/v3/prompts/built-in-remix-prompt.md?raw"
import { useAllPrompts } from "@/apps/web-app/hooks/use-all-prompts"


const getPromptByScriptType = (type?: string) => {
    switch (type) {
        case "script":
            return scriptPrompt
        case "doc_plugin":
            return docPluginPrompt
        case "py_script":
            return pythonScriptPrompt
        case "udf":
            return builtInRemixPromptForUDF
        case "prompt":
            return builtInRemixPromptForPrompt
        default:
            return builtInRemixPrompt
    }
}

export const useAdditionalData = (
    contextNodes: ITreeNode[] = [],
    task?: 'udf' | 'script' | 'prompt' | 'm_block' | 'py_script'
) => {
    const { space } = useCurrentPathInfo()
    const currentNode = useCurrentNode()
    const [_map, { set, reset, get }] = useMap<string, string>()
    const [_tableMap, { set: setTable, reset: resetTable, get: getTable }] = useMap<string, string>()
    const { sqlite } = useSqlite()
    const { getDocMarkdown } = useDocEditor(sqlite)

    const tables = useMemo(
        () =>
            contextNodes
                .filter((node) => node.type === "table")
                .map((node) => getRawTableNameById(node.id)),
        [contextNodes]
    )

    const docs = useMemo(
        () =>
            contextNodes.filter((node) => node.type === "doc").map((node) => node.id),
        [contextNodes]
    )

    useEffect(() => {
        async function loadDocs() {
            for (const docId of docs) {
                const markdown = await getDocMarkdown(docId)
                set(docId, markdown)
            }
        }
        loadDocs()
    }, [docs, getDocMarkdown, set])

    useEffect(() => {
        async function loadTableSchemas() {
            if (!sqlite) return

            console.log(tables)
            for (const tableName of tables) {
                try {
                    // Get table schema using PRAGMA table_info
                    const columns = await sqlite.listUiColumns(tableName)
                    /**
                     *   name: string
  type: FieldType
  table_column_name: string
  table_name: string
  property: T
  created_at?: string
  updated_at?: string
                     */
                    console.log('columns', columns)
                    const schemaText = columns.map((col) =>
                        `${col.name}`
                    ).join('\n')

                    setTable(tableName, schemaText)
                } catch (error) {
                    console.warn(`Failed to load schema for table ${tableName}:`, error)
                }
            }
        }
        loadTableSchemas()
    }, [tables, sqlite, setTable])

    const additionalData = useMemo(() => {
        return `
  <additional_data>
  <attached_docs>
  ${Array.from(_map.entries()).map(([key, value]) => `<doc id="${key}" title="${contextNodes.find(node => node.id === key)?.name}">\n${value}\n</doc>`).join("\n")}
  </attached_docs>
  <attached_tables>
  ${Array.from(_tableMap.entries()).map(([tableName, schema]) => `<table id="${getTableIdByRawTableName(tableName)}" name="${tableName}" title="${contextNodes.find(node => getRawTableNameById(node.id) === tableName)?.name}">\n${schema}\n</table>`).join("\n")}
  </attached_tables>
  </additional_data>
  <use_info>
${currentNode ? ` <current_node id="${currentNode?.id}" name="${currentNode?.name}" type="${currentNode?.type}" />` : ""
            }
  <current_space id="${space}" name="${space}" />
  </use_info>
  `
    }, [_map, _tableMap, contextNodes, currentNode, space])

    return additionalData
}


export const useSystemPrompt = (
    contextNodes: ITreeNode[] = [],
) => {
    const additionalData = useAdditionalData(contextNodes)
    const extension = useCurrentExtension()
    const { getRemixPrompt } = useRemixPrompt()
    const [remixPrompt, setRemixPrompt] = useState("")
    // const [selectedCustomPromptId, setSelectedCustomPromptId] = useState<
    //     string | null
    // >(null)

    // Memoize the base prompt calculation to prevent unnecessary recalculations
    const basePrompt = useMemo(() => {
        if (!extension?.type) {
            return null
        }
        return getPromptByScriptType(extension?.type)
    }, [extension?.type])

    // Memoize the extension data to prevent unnecessary re-renders
    const extensionData = useMemo(() => ({
        bindings: extension?.bindings,
        code: extension?.ts_code || extension?.code,
        type: extension?.type
    }), [extension?.bindings, extension?.ts_code, extension?.code, extension?.type])

    useEffect(() => {
        if (!basePrompt) {
            return
        }
        getRemixPrompt(
            extensionData.bindings,
            extensionData.code,
            basePrompt
        ).then(setRemixPrompt)
    }, [
        extensionData.bindings,
        extensionData.code,
        basePrompt,
        getRemixPrompt,
    ])

    return `
    ${systemPromptRaw}
    Below are some potentially helpful/relevant pieces of information for figuring out to respond
    ${additionalData}

    Below is the custom prompt for this task:
    <custom_prompt>
    ${remixPrompt}
    </custom_prompt>
    `
}

