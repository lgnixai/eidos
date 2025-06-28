import { useCallback, useEffect } from "react"
import { useSqlite } from "@/apps/web-app/hooks/use-sqlite"

import { create } from 'zustand'
import { IExtension } from "@/packages/core/meta-table/extension"

interface PromptsState {
    prompts: IExtension[]
    setPrompts: (prompts: IExtension[]) => void
}

export const usePromptsStore = create<PromptsState>((set) => ({
    prompts: [],
    setPrompts: (prompts) => set({ prompts }),
}))

export const useAllPrompts = () => {
    const { sqlite } = useSqlite()
    const { prompts, setPrompts } = usePromptsStore()

    const fetchPrompts = useCallback(async () => {
        if (!sqlite) return
        const promptList = await sqlite?.script.list({
            type: "prompt",
            enabled: true,
        })
        setPrompts(promptList)
    }, [sqlite, setPrompts])

    useEffect(() => {
        fetchPrompts()
    }, [sqlite, fetchPrompts])

    const reload = () => {
        fetchPrompts()
    }

    return {
        prompts,
        reload,
    }
}
