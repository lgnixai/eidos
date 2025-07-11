import { ChevronDownIcon, CodeIcon, ToyBrickIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useNewExtension } from "../hooks/use-new-extension"

const ExtensionTooltip = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="ring ring-primary invisible group-hover:visible absolute right-full top-0 mr-2 w-64 rounded-md border text-popover-foreground bg-popover p-3 text-sm before:absolute before:-right-4 before:top-0 before:h-full before:w-4"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

export const NewExtensionButton = () => {
  const { handleCreateNewExtension } = useNewExtension()
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="xs">
          {t("common.new")} <ChevronDownIcon className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="overflow-visible" align="end">
        <DropdownMenuLabel>{t("extension.createNew")}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Script Extensions */}
        <DropdownMenuLabel className="flex items-center text-xs text-muted-foreground">
          <CodeIcon className="mr-2 h-3 w-3" />
          Script
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="group relative"
          onClick={() => handleCreateNewExtension("tool")}
        >
          {t("extension.tool")}
          <ExtensionTooltip>
            {t("extension.toolDescription")}
          </ExtensionTooltip>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="group relative"
          onClick={() => handleCreateNewExtension("tableAction")}
        >
          {t("extension.tableAction")}
          <ExtensionTooltip>
            {t("extension.tableActionDescription")}
          </ExtensionTooltip>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="group relative"
          onClick={() => handleCreateNewExtension("udf")}
        >
          {t("extension.udf")}{" "}
          <Badge variant="secondary">{t("common.badge.alpha")}</Badge>
          <ExtensionTooltip>
            {t("extension.udfDescription")}
            <br />
            <span className="text-red-400">{t("extension.udfWarning")}</span>
          </ExtensionTooltip>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Block Extensions */}
        <DropdownMenuLabel className="flex items-center text-xs text-muted-foreground">
          <ToyBrickIcon className="mr-2 h-3 w-3" />
          Block
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="group relative"
          onClick={() => handleCreateNewExtension("tableView")}
        >
          {t("extension.tableView")}
          <ExtensionTooltip>
            {t("extension.tableViewDescription")}
          </ExtensionTooltip>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="group relative"
          onClick={() => handleCreateNewExtension("extNode")}
        >
          {t("extension.extNode")}
          <Badge variant="default" className="bg-primary">
            {t("common.badge.new")}
          </Badge>
          <ExtensionTooltip>
            {t("extension.extNodeDescription")}
          </ExtensionTooltip>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
