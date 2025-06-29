import { useEffect, useState } from "react"
import type { IExtension } from "@/packages/core/meta-table/extension"

import { useSqlite } from "./use-sqlite"

export const useAllExtensions = (space: string) => {
  const [scripts, setScripts] = useState<IExtension[]>([])
  const { sqlite } = useSqlite(space)

  useEffect(() => {
    if (!sqlite) return
    sqlite.listScripts("enabled").then((res) => {
      setScripts(res)
    })
  }, [space, sqlite])

  return scripts
}
