import { ChevronDownIcon } from "lucide-react"
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
        <DropdownMenuItem
          className="group relative"
          onClick={() => handleCreateNewExtension("m_block")}
        >
          {t("extension.microBlock")}{" "}
          <ExtensionTooltip>
            {t("extension.microBlockDescription")}
          </ExtensionTooltip>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="group relative"
          onClick={() => handleCreateNewExtension()}
        >
          {t("extension.script")}
          <ExtensionTooltip>
            {t("extension.scriptDescription")}
          </ExtensionTooltip>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="group relative"
          onClick={() => handleCreateNewExtension("ext_node")}
        >
          {t("extension.extNode")}
          <Badge variant="default" className="bg-primary">
            {t("common.badge.new")}
          </Badge>
          <ExtensionTooltip>
            {t("extension.extNodeDescription")}
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
        <DropdownMenuItem
          className="group relative"
          onClick={() => handleCreateNewExtension("prompt")}
        >
          {t("extension.prompt")}
          <ExtensionTooltip>
            {t("extension.promptDescription")}
          </ExtensionTooltip>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="group relative"
          onClick={() => handleCreateNewExtension("doc_plugin")}
        >
          {t("extension.docPlugin")}
          <Badge variant="secondary">{t("common.badge.alpha")}</Badge>
          <ExtensionTooltip>
            {t("extension.docPluginDescription")}
          </ExtensionTooltip>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="group relative"
          onClick={() => handleCreateNewExtension("py_script")}
        >
          {t("extension.pythonScript")}{" "}
          <Badge variant="secondary">{t("common.badge.alpha")}</Badge>
          {/* <Badge variant="default" className="bg-primary">
            {t("common.badge.new")}
          </Badge> */}
          <ExtensionTooltip>
            {t("extension.pythonScriptDescription")}
          </ExtensionTooltip>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
