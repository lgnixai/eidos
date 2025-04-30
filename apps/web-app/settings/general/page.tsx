import { useTranslation } from "react-i18next"

import { Separator } from "@/components/ui/separator"
import { ProfileForm } from "@/apps/web-app/settings/general/profile-form"

import { AccountSection } from "./account-section"

export default function SettingsGeneralPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("settings.general")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("settings.general.description")}
        </p>
      </div>
      <Separator />
      <ProfileForm />
      <Separator />
      <AccountSection />
    </div>
  )
}
