import { useTranslation } from "react-i18next"

import { Separator } from "@/components/ui/separator"

import { SyncForm } from "./sync-form"

export default function SettingsSyncPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("settings.sync", "Sync")}</h3>
        <p className="text-sm text-muted-foreground">
          {t(
            "settings.sync.description",
            "Configure synchronization settings."
          )}
        </p>
      </div>
      <Separator />
      <SyncForm />
    </div>
  )
} 