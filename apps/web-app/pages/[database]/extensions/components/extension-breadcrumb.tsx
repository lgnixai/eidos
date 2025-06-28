import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useCurrentPathInfo } from "@/apps/web-app/hooks/use-current-pathinfo"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { useExtensionById } from "../../../../hooks/use-extension"

interface ScriptBreadcrumbProps {
  scriptId: string
}

export const ScriptBreadcrumb = ({ scriptId }: ScriptBreadcrumbProps) => {
  const script = useExtensionById(scriptId)
  const { space } = useCurrentPathInfo()
  const { t } = useTranslation()

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={`/${space}/extensions`}>{t("extension.breadcrumb.extensions")}</Link>
          </BreadcrumbLink>
          <BreadcrumbSeparator />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbPage>{script?.name}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
