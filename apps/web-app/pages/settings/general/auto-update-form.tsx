"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { useDesktopClient } from "@/apps/web-app/hooks/use-desktop-client"

export function AutoUpdateForm() {
  const { t } = useTranslation()
  const { isDesktop } = useDesktopClient()
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)

  useEffect(() => {
    if (!isDesktop) return

    const loadAutoUpdateConfig = async () => {
      try {
        const config = await (window as any).eidos.config.get("autoUpdate")
        setAutoUpdateEnabled(config?.enabled ?? true)
      } catch (error) {
        console.error("Failed to load auto-update config:", error)
        setAutoUpdateEnabled(true)
      } finally {
        setIsLoadingConfig(false)
      }
    }

    loadAutoUpdateConfig()
  }, [isDesktop])

  const handleToggleAutoUpdate = async (enabled: boolean) => {
    if (!isDesktop) return

    try {
      await (window as any).eidos.config.set("autoUpdate", { enabled })
      setAutoUpdateEnabled(enabled)
    } catch (error) {
      toast({
        title: t("settings.general.autoUpdateUpdateFailed"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  if (!isDesktop) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <div className="text-base font-medium">
            {t("settings.general.enableAutoUpdate")}
          </div>
          <div className="text-sm text-muted-foreground">
            {t("settings.general.enableAutoUpdateDescription")}
          </div>
        </div>
        <Switch
          checked={autoUpdateEnabled}
          onCheckedChange={handleToggleAutoUpdate}
          disabled={isLoadingConfig}
        />
      </div>
    </div>
  )
}
