import { useState } from "react"
import { IExtension } from "@/packages/core/meta-table/extension"
import { useLoaderData, useRevalidator } from "react-router-dom"

import { useToast } from "@/components/ui/use-toast"

import { useExtension } from "@/apps/web-app/hooks/use-extension"
import { ExtensionBindings } from "./extension-bindings"
import { EnvironmentVariables } from "./environment-variables"

export const BlockConfig = () => {
  const block = useLoaderData() as IExtension
  const [envMap, setEnvMap] = useState<Record<string, string>>(
    block.env_map || {}
  )
  const [bindings, setBindings] = useState<
    Record<string, { type: "table"; value: string }>
  >(block.bindings || {})

  const revalidator = useRevalidator()
  const { toast } = useToast()
  const { updateExtension } = useExtension()

  const updateWithToast = async (
    newEnvMap = envMap,
    newBindings = bindings
  ) => {
    try {
      await updateExtension({
        id: block.id,
        env_map: newEnvMap,
        bindings: newBindings,
      })
      revalidator.revalidate()
      toast({ title: "Block Updated Successfully" })
    } catch (error) {
      toast({
        title: "Failed to update block",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleUpdateBindings = (
    newBindings: Record<string, { type: "table"; value: string }>
  ) => {
    setBindings(newBindings)
    updateWithToast(envMap, newBindings)
  }

  return (
    <div className="flex flex-col gap-4">
      <EnvironmentVariables
        envMap={envMap}
        onUpdateEnvMap={(newEnvMap) => {
          setEnvMap(newEnvMap)
          updateWithToast(newEnvMap)
        }}
      />
      <ExtensionBindings bindings={bindings} onUpdateBindings={handleUpdateBindings} />
    </div>
  )
}
