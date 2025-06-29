import { useState } from "react"
import { ExternalLinkIcon } from "lucide-react"

import { useExtensionNavigateById } from "@/apps/web-app/hooks/use-extension-navigate"
import { useScriptData } from "@/apps/web-app/hooks/use-script-data"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScriptSelector } from "@/components/script-selector"

import type { DataScriptConfig } from "./types"

interface ScriptDataSourceProps {
  config: DataScriptConfig
  onConfigChange: (config: DataScriptConfig) => void
  onDataChange: (data: any[]) => void
}

export function ScriptDataSource({
  config,
  onConfigChange,
  onDataChange,
}: ScriptDataSourceProps) {
  const [isExecutingScript, setIsExecutingScript] = useState(false)
  const [dataError, setDataError] = useState<string>("")

  const { getScriptData } = useScriptData()
  const navigateToScript = useExtensionNavigateById()

  const handleExecuteScript = async () => {
    if (!config.scriptId) return
    setIsExecutingScript(true)
    try {
      const data = await getScriptData(config.scriptId)
      setIsExecutingScript(false)
      if (!Array.isArray(data)) {
        setDataError("Script must return an array")
        return
      }
      setDataError("")
      onDataChange(data)
    } catch (err) {
      setDataError("Failed to execute script")
    }
  }

  return (
    <div className="space-y-2">
      <Label>Script</Label>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ScriptSelector
            value={config.scriptId || ""}
            onSelect={(scriptId) => onConfigChange({ ...config, scriptId })}
          />

          <Button
            onClick={handleExecuteScript}
            size="sm"
            disabled={!config.scriptId || isExecutingScript}
          >
            {isExecutingScript ? "Executing..." : "Fetch Data"}
          </Button>
          {config.scriptId && (
            <Button
              size="icon"
              variant="link"
              onClick={() => {
                navigateToScript(config.scriptId!)
              }}
            >
              <ExternalLinkIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
