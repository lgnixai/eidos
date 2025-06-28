import { IExtension } from "@/packages/core/meta-table/extension"
import { useCallback, useEffect, useState } from "react"

import { useSqlite } from "@/apps/web-app/hooks/use-sqlite"

import { checkPromptEnable } from "../pages/[database]/extensions/helper"

export const useExtension = () => {
  const { sqlite } = useSqlite()
  const [installLoading, setInstallLoading] = useState(false)

  const addExtension = useCallback(async (script: IExtension) => {
    if (!sqlite) return
    await sqlite.addExtension(script)
    console.log("addExtension", script)
  }, [sqlite])

  const deleteExtension = useCallback(async (id: string) => {
    if (!sqlite) return
    await sqlite.deleteExtension(id)
    console.log("deleteExtension", id)
  }, [sqlite])

  const updateExtension = useCallback(async (script: Partial<IExtension>) => {
    if (!sqlite || !script.id) return
    const { version, ...rest } = script
    if (!version) {
      await sqlite.script.set(script.id, rest)
    } else {
      await sqlite.script.set(script.id, script)
    }
    console.log("updateExtension", script)
  }, [sqlite])

  const installExtension = async (script: IExtension) => {
    setInstallLoading(true)
    script && (await addExtension(script))
    setInstallLoading(false)
  }
  const enableExtension = useCallback(async (id: string) => {
    if (!sqlite) return
    const data = await sqlite.script.get(id)
    if (data?.type === "prompt") {
      checkPromptEnable(data)
    }
    await sqlite.enableExtension(id)
    console.log("enableExtension", id)
  }, [sqlite])

  const disableExtension = useCallback(async (id: string) => {
    if (!sqlite) return
    await sqlite.disableExtension(id)
    console.log("disableExtension", id)
  }, [sqlite])

  return {
    addExtension,
    deleteExtension,
    updateExtension,
    installExtension,
    installLoading,
    enableExtension,
    disableExtension,
  }
}

export const useExtensionById = (id?: string) => {
  const { sqlite } = useSqlite()
  const [script, setScript] = useState<IExtension | null>(null)
  useEffect(() => {
    if (!sqlite || !id) return
    const fetchScript = async () => {
      const script = await sqlite.script.get(id)
      setScript(script)
    }
    fetchScript()
  }, [sqlite, id])
  if (!id) return null
  return script
}
