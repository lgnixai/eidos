import type { IExtension } from "@/packages/core/meta-table/extension"
import {
  ExternalLinkIcon,
  MoreVerticalIcon,
  PanelRightIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"

import { IconMap } from "../page"

interface ExtensionListItemProps {
  script: IExtension
  space: string
  onDelete: (id: string) => void
  onToggleEnabled: (script: IExtension, enabled: boolean) => void
  onAddToSidebar: (id: string) => void
  onOpenStandalone: (id: string) => void
  showReload?: boolean
  onReload?: () => void
}

export const ExtensionListItem = ({
  script,
  space,
  onDelete,
  onToggleEnabled,
  onAddToSidebar,
  onOpenStandalone,
  showReload,
  onReload,
}: ExtensionListItemProps) => {
  const Icon = IconMap[script.type] || IconMap.script
  const iconIsDataUri = script.icon && script.icon.startsWith("data:image")

  return (
    <div className="flex items-center justify-between border-b px-4 py-3 hover:bg-muted/50">
      <Link
        to={`/${space}/extensions/${script.id}`}
        className="flex flex-1 items-center gap-3"
      >
        {iconIsDataUri ? (
          <img
            src={script.icon}
            alt={script.name}
            className="h-6 w-6 shrink-0 opacity-70 border rounded-md"
          />
        ) : (
          <Icon size={24} className="opacity-60" />
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{script.name}</span>
            <Badge variant="outline" className="text-xs">
              v{script.version}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {script.type}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {script.description || "No description"}
          </div>
        </div>
      </Link>

      <div
        className="flex items-center gap-2"
        onClick={(e) => e.preventDefault()}
      >
        {showReload && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onReload}
          >
            <RefreshCwIcon size={16} />
          </Button>
        )}
        <Switch
          checked={script.enabled}
          onCheckedChange={(checked) => onToggleEnabled(script, checked)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVerticalIcon size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {script.type === "m_block" && (
              <>
                <DropdownMenuItem onClick={() => onAddToSidebar(script.id)}>
                  <PanelRightIcon size={16} className="mr-2" />
                  Add to Sidebar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenStandalone(script.id)}>
                  <ExternalLinkIcon size={16} className="mr-2" />
                  Open Standalone
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(script.id)}
            >
              <Trash2Icon size={16} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
