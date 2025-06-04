import { useMap } from "ahooks"
import { useEffect, useMemo, useState } from "react"

import { useRemixPrompt } from "@/apps/web-app/[database]/extensions/hooks/use-remix-prompt"
import { useCurrentExtension, useCurrentNode } from "@/hooks/use-current-node"
import { useCurrentPathInfo } from "@/hooks/use-current-pathinfo"
import { useDocEditor } from "@/hooks/use-doc-editor"
import { useSqlite } from "@/hooks/use-sqlite"
import { ITreeNode } from "@/lib/store/ITreeNode"
import { getRawTableNameById } from "@/lib/utils"
import systemPromptRaw from "./prompt.md?raw"

import docPluginPrompt from "@/lib/v3/prompts/built-in-remix-prompt-for-doc-plugin.md?raw"
import builtInRemixPromptForPrompt from "@/lib/v3/prompts/built-in-remix-prompt-for-prompt.md?raw"
import pythonScriptPrompt from "@/lib/v3/prompts/built-in-remix-prompt-for-python-script.md?raw"
import scriptPrompt from "@/lib/v3/prompts/built-in-remix-prompt-for-script.md?raw"
import builtInRemixPromptForUDF from "@/lib/v3/prompts/built-in-remix-prompt-for-udf.md?raw"
import builtInRemixPrompt from "@/lib/v3/prompts/built-in-remix-prompt.md?raw"
import { useAllPrompts } from "@/hooks/use-all-prompts"


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

    const additionalData = useMemo(() => {
        return `
  <additional_data>
  <attached_docs>
  ${Array.from(_map.entries()).map(([key, value]) => `<doc id="${key}" title="${contextNodes.find(node => node.id === key)?.name}">\n${value}\n</doc>`).join("\n")}
  </attached_docs>
  </additional_data>
  <use_info>
  <current_node id="${currentNode?.id}" name="${currentNode?.name}" type="${currentNode?.type}" />
  <current_space id="${space}" name="${space}" />
  </use_info>
  `
    }, [_map, contextNodes, currentNode, space])

    return additionalData
}


export const useSystemPrompt = (
    contextNodes: ITreeNode[] = [],
) => {
    const additionalData = useAdditionalData(contextNodes)
    const extension = useCurrentExtension()
    const { prompts } = useAllPrompts()
    const { getRemixPrompt } = useRemixPrompt()
    const [remixPrompt, setRemixPrompt] = useState("")
    const [selectedCustomPromptId, setSelectedCustomPromptId] = useState<
        string | null
    >(null)

    // Memoize the base prompt calculation to prevent unnecessary recalculations
    const basePrompt = useMemo(() => {
        if (!extension?.type) {
            return null
        }
        return selectedCustomPromptId
            ? prompts.find((p) => p.id === selectedCustomPromptId)?.code ||
            getPromptByScriptType(extension?.type)
            : getPromptByScriptType(extension?.type)
    }, [selectedCustomPromptId, prompts, extension?.type])

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

