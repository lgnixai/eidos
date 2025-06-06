import { useEffect, useState } from "react"
import { IExtension } from "@/packages/core/meta-table/extension"

import { useSqlite } from "@/hooks/use-sqlite"

export const useAllScripts = () => {
  const { sqlite } = useSqlite()

  const [scripts, setScripts] = useState<IExtension[]>([])
  useEffect(() => {
    if (!sqlite) {
      return
    }
    const fetchScripts = async () => {
      const scripts = await sqlite?.script.list({
        type: "script",
        enabled: true,
      })
      const pyScripts = await sqlite?.script.list({
        type: "py_script",
        enabled: true,
      })
      setScripts([...scripts, ...pyScripts])
    }
    fetchScripts()
  }, [sqlite])

  return scripts
}
