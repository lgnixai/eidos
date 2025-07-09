import { useEffect, useState } from "react"
import type { IExtension } from "@/packages/core/meta-table/extension"

import { useSqlite } from "./use-sqlite"

export const useAllExtensions = (space: string) => {
  const [scripts, setScripts] = useState<IExtension[]>([])
  const { sqlite } = useSqlite(space)

  useEffect(() => {
    if (!sqlite) return
    const fetchExtensions = async () => {
      try {
        // Use the extension table's list method with proper status filtering
        const res = await sqlite.extension.list({ enabled: true })
        setScripts(res)
      } catch (error) {
        console.error("Failed to fetch extensions:", error)
        setScripts([])
      }
    }
    fetchExtensions()
  }, [space, sqlite])

  return scripts
}
