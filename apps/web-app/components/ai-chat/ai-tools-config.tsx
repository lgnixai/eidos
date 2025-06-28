import { WrenchIcon } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { useAllTools } from "@/apps/web-app/hooks/use-all-tools"
import { useCurrentPathInfo } from "@/apps/web-app/hooks/use-current-pathinfo"
import { useExtensionNavigateById } from "@/apps/web-app/hooks/use-extension-navigate"

import { useAIChatStore } from "./store"

interface AIToolsConfigProps {
  isLoading?: boolean
  onToolsChange?: (filteredTools: Record<string, any>) => void
}

export function AIToolsConfig({
  isLoading = false,
  onToolsChange,
}: AIToolsConfigProps) {
  const { t } = useTranslation()
  const { space } = useCurrentPathInfo()
  const tools = useAllTools()

  const {
    getEnabledTools,
    setEnabledTools,
    toggleTool,
    getMaxSteps,
    setMaxSteps,
    maxSteps: storeMaxSteps,
    enabledTools: storeEnabledTools,
  } = useAIChatStore()

  const enabledTools = useMemo(() => {
    const currentEnabledTools = storeEnabledTools[space] || {}
    if (Object.keys(currentEnabledTools).length === 0) {
      const initialState: Record<string, boolean> = {}
      Object.keys(tools).forEach((toolName) => {
        initialState[toolName] = true
      })
      setEnabledTools(space, initialState)
      return initialState
    }
    return currentEnabledTools
  }, [tools, space, setEnabledTools, storeEnabledTools])

  const maxSteps = useMemo(
    () => getMaxSteps(space),
    [getMaxSteps, space, storeMaxSteps]
  )

  const filteredTools = useMemo(() => {
    const filtered: Record<string, any> = {}
    Object.entries(tools).forEach(([key, tool]) => {
      if (enabledTools[key]) {
        filtered[key] = tool
      }
    })
    return filtered
  }, [tools, enabledTools])

  useMemo(() => {
    onToolsChange?.(filteredTools)
  }, [filteredTools, onToolsChange])

  const handleToggleTool = (toolName: string) => {
    toggleTool(space, toolName)
  }

  const handleMaxStepsChange = (value: string) => {
    const steps = parseInt(value, 10)
    if (!isNaN(steps) && steps > 0) {
      console.log("Setting maxSteps to:", steps, "for space:", space)
      setMaxSteps(space, steps)
    }
  }

  const navigateToExtension = useExtensionNavigateById()

  // Helper function to check if toolId matches xx.xxx format and extract extensionId
  const getExtensionId = (toolId: string): string | null => {
    const match = toolId.match(/^([^.]+)\.(.+)$/)
    return match ? match[1] : null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isLoading}>
          <WrenchIcon className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">
              {t("aiChat.toolsConfig.title", "Tools Configuration")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t(
                "aiChat.toolsConfig.description",
                "Configure which tools are available for the AI assistant"
              )}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label className="text-sm font-medium">Max Steps</Label>
                <p className="text-xs text-muted-foreground">
                  Maximum number of steps for tool calls
                </p>
              </div>
              <Input
                type="number"
                min="1"
                max="20"
                value={maxSteps}
                onChange={(e) => handleMaxStepsChange(e.target.value)}
                className="w-16 h-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            {Object.entries(tools).map(([toolName, tool]) => {
              const extensionId = getExtensionId((tool as any).id || toolName)

              return (
                <div
                  key={toolName}
                  className="flex items-start justify-between"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">{toolName}</Label>
                      {extensionId ? (
                        <Badge
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-secondary/80 rounded-md"
                          onClick={() => navigateToExtension(extensionId)}
                        >
                          User-defined
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs rounded-md">
                          Built-in
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(tool as any).description || "No description available"}
                    </p>
                  </div>
                  <Switch
                    checked={enabledTools[toolName] || false}
                    onCheckedChange={() => handleToggleTool(toolName)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Hook to get filtered tools for external use
export function useFilteredTools() {
  const { space } = useCurrentPathInfo()
  const tools = useAllTools()
  const { enabledTools: storeEnabledTools } = useAIChatStore()

  return useMemo(() => {
    const enabledTools = storeEnabledTools[space] || {}
    const filtered: Record<string, any> = {}

    Object.entries(tools).forEach(([key, tool]) => {
      const isEnabled =
        Object.keys(enabledTools).length === 0 ? true : enabledTools[key]
      if (isEnabled) {
        filtered[key] = tool
      }
    })

    return filtered
  }, [tools, space, storeEnabledTools])
}

// Hook to get max steps for external use
export function useMaxSteps() {
  const { space } = useCurrentPathInfo()
  const { getMaxSteps } = useAIChatStore()

  return useMemo(() => getMaxSteps(space), [getMaxSteps, space])
}
