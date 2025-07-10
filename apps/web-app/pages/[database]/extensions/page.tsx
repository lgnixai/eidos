import type { IExtension } from "@/packages/core/meta-table/extension"
import { useMount } from "ahooks"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  FunctionSquareIcon,
  SquareCodeIcon,
  ToyBrickIcon,
  WrenchIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useLoaderData, useRevalidator } from "react-router-dom"
import { BooleanParam, StringParam, useQueryParam } from "use-query-params"

import { useCurrentPathInfo } from "@/apps/web-app/hooks/use-current-pathinfo"
import { useExtension } from "@/apps/web-app/hooks/use-extension"
import { useFavBlocks } from "@/apps/web-app/hooks/use-fav-blocks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { EIDOS_SPACE_BASE_URL } from "@/lib/const"
import { cn, getExtensionUrl } from "@/lib/utils"

import { useAppsStore, useSpaceAppStore } from "../store"
import { ExtensionListItem } from "./components/extension-list-item"
import { NewExtensionButton } from "./components/new-extension-button"
import { useDirHandleStore, useLocalScript } from "./hooks/use-local-script"

interface ExtensionCategory {
  id: string
  name: string
  icon: typeof ToyBrickIcon
  items: ExtensionType[]
}

interface ExtensionType {
  id: string
  name: string
  icon: typeof SquareCodeIcon
  category: "script" | "block"
}

export const extensionCategories: ExtensionCategory[] = [
  {
    id: "script",
    name: "Script",
    icon: SquareCodeIcon,
    items: [
      {
        id: "tool",
        name: "Tools",
        icon: WrenchIcon,
        category: "script",
      },
      {
        id: "tableAction",
        name: "Table Actions",
        icon: FunctionSquareIcon,
        category: "script",
      },
      {
        id: "udf",
        name: "UDFs",
        icon: FunctionSquareIcon,
        category: "script",
      },
    ],
  },
  {
    id: "block",
    name: "Block",
    icon: ToyBrickIcon,
    items: [
      {
        id: "tableView",
        name: "Table Views",
        icon: ToyBrickIcon,
        category: "block",
      },
      {
        id: "extNode",
        name: "Extension Nodes",
        icon: FileIcon,
        category: "block",
      },
    ],
  },
]

// Create a flat map for easier lookup
export const extensionTypesMap = extensionCategories.reduce(
  (acc, category) => {
    category.items.forEach((item) => {
      acc[item.id] = item
    })
    return acc
  },
  {} as Record<string, ExtensionType>
)

// Export IconMap for extension types
export const IconMap = {
  // New architecture types
  script: SquareCodeIcon,
  block: ToyBrickIcon,
  // Meta types
  tool: WrenchIcon,
  tableAction: FunctionSquareIcon,
  udf: FunctionSquareIcon,
  tableView: ToyBrickIcon,
  extNode: FileIcon,
  // Fallback
  ...Object.fromEntries(
    Object.entries(extensionTypesMap).map(([id, type]) => [id, type.icon])
  ),
} as Record<string, typeof SquareCodeIcon>

// Tree folder state management
interface FolderState {
  scripts: boolean
  blocks: boolean
}

export const ScriptPage = () => {
  const scripts = useLoaderData() as IExtension[]
  const { space } = useCurrentPathInfo()

  const [filter, setFilter] = useQueryParam("filter", StringParam)
  const [searchTerm, setSearchTerm] = useQueryParam("searchTerm", StringParam)
  const [showEnabledOnly, setShowEnabledOnly] = useQueryParam(
    "showEnabledOnly",
    BooleanParam
  )

  // Tree folder state
  const [folderState, setFolderState] = useState<FolderState>({
    scripts: true,
    blocks: true,
  })

  // Set default values - default to scripts folder
  const currentFilter = filter || "scripts"
  const currentSearchTerm = searchTerm || ""
  const currentShowEnabledOnly = showEnabledOnly || false

  const handleSetFilter = (value: string) => {
    setFilter(value === "scripts" ? undefined : value)
  }

  const handleSetSearchTerm = (value: string) => {
    setSearchTerm(value || undefined)
  }

  const handleSetShowEnabledOnly = (value: boolean) => {
    setShowEnabledOnly(value || undefined)
  }

  const toggleFolder = (folder: keyof FolderState) => {
    setFolderState((prev) => ({
      ...prev,
      [folder]: !prev[folder],
    }))
  }

  // Helper functions for categorizing extensions
  const isScriptType = (script: IExtension) => {
    return (
      script.type === "script" &&
      script.meta?.type &&
      ["tool", "tableAction", "udf"].includes(script.meta.type)
    )
  }

  const isBlockType = (script: IExtension) => {
    return (
      script.type === "block" &&
      script.meta?.type &&
      ["tableView", "extNode"].includes(script.meta.type)
    )
  }

  const _scripts = scripts

  const filterExts = useMemo(() => {
    let filtered = _scripts

    // Apply type filter
    if (currentFilter === "scripts") {
      filtered = filtered.filter(isScriptType)
    } else if (currentFilter === "blocks") {
      filtered = filtered.filter(isBlockType)
    } else {
      // Filter for specific meta type
      filtered = filtered.filter(
        (script) => script.meta?.type === currentFilter
      )
    }

    // Apply search filter
    if (currentSearchTerm) {
      filtered = filtered.filter(
        (script) =>
          script.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
          script.description
            .toLowerCase()
            .includes(currentSearchTerm.toLowerCase())
      )
    }

    // Add enabled filter
    if (currentShowEnabledOnly) {
      filtered = filtered.filter((script) => script.enabled)
    }

    return filtered
  }, [currentFilter, _scripts, currentSearchTerm, currentShowEnabledOnly])

  const {
    deleteExtension,
    enableExtension,
    disableExtension,
    updateExtension,
    addExtension,
  } = useExtension()
  const revalidator = useRevalidator()

  // Add sidebar functionality
  const { addApp } = useAppsStore()
  const { setCurrentApp } = useSpaceAppStore()

  // Add favorite functionality
  const { isFavorite, toggleFavBlock } = useFavBlocks()

  useMount(() => {
    revalidator.revalidate()
  })

  const handleDelete = async (id: string) => {
    await deleteExtension(id)
    revalidator.revalidate()
  }

  const handleAddToSidebar = (blockId: string) => {
    const app = `block://${blockId}@${space}`
    const { apps } = useAppsStore.getState()

    // Check if app already exists in sidebar
    if (apps.includes(app)) {
      return
    }

    addApp(app)
    setCurrentApp(app)
  }

  const handleOpenStandalone = (blockId: string) => {
    // Open Block in standalone mode (new window/tab)
    const newUrl = getExtensionUrl(blockId, space)
    window.open(newUrl)
  }

  const handleToggleFavorite = (script: IExtension) => {
    toggleFavBlock({
      id: script.id,
      name: script.name,
      icon: script.icon,
    })
  }

  const { dirHandle, scriptId } = useDirHandleStore()
  const { reload } = useLocalScript()

  const handleToggleEnabled = async (script: IExtension, checked: boolean) => {
    const { id } = script
    if (checked) {
      await enableExtension(id)
    } else {
      await disableExtension(id)
    }
    revalidator.revalidate()
  }

  const storeURL = `${EIDOS_SPACE_BASE_URL}/extensions`
  const handleReload = async () => {
    const script = await reload()
    await updateExtension(script)
    revalidator.revalidate()
  }

  // Helper function to get the current category name
  const getCurrentCategoryName = () => {
    if (currentFilter === "scripts") return "Scripts"
    if (currentFilter === "blocks") return "Blocks"

    for (const category of extensionCategories) {
      const item = category.items.find((item) => item.id === currentFilter)
      if (item) {
        return item.name
      }
    }
    return "Extensions"
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar - Tree Style */}
      <div className="w-56 flex-shrink-0 border-r bg-muted/20">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-1">
            {/* Scripts Folder */}
            <div>
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  currentFilter === "scripts"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => {
                  toggleFolder("scripts")
                  handleSetFilter("scripts")
                }}
              >
                {folderState.scripts ? (
                  <ChevronDownIcon size={16} />
                ) : (
                  <ChevronRightIcon size={16} />
                )}
                <SquareCodeIcon size={16} />
                <span className="flex-1 text-left">Scripts</span>
                <span className="text-xs opacity-70">
                  {_scripts.filter(isScriptType).length}
                </span>
              </button>

              {folderState.scripts && (
                <div className="space-y-1">
                  {extensionCategories
                    .find((cat) => cat.id === "script")
                    ?.items.map((type) => {
                      const TypeIcon = type.icon
                      const isActive = currentFilter === type.id
                      const count = _scripts.filter(
                        (s) => s.meta?.type === type.id
                      ).length

                      if (count === 0) return null

                      return (
                        <button
                          key={type.id}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md py-1.5 text-sm transition-colors",
                            "pl-9 pr-3",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                          onClick={() => handleSetFilter(type.id)}
                        >
                          <TypeIcon size={16} />
                          <span className="flex-1 text-left">{type.name}</span>
                          <span className="text-xs opacity-70">{count}</span>
                        </button>
                      )
                    })}
                </div>
              )}
            </div>

            {/* Blocks Folder */}
            <div>
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  currentFilter === "blocks"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => {
                  toggleFolder("blocks")
                  handleSetFilter("blocks")
                }}
              >
                {folderState.blocks ? (
                  <ChevronDownIcon size={16} />
                ) : (
                  <ChevronRightIcon size={16} />
                )}
                <ToyBrickIcon size={16} />
                <span className="flex-1 text-left">Blocks</span>
                <span className="text-xs opacity-70">
                  {_scripts.filter(isBlockType).length}
                </span>
              </button>

              {folderState.blocks && (
                <div className="space-y-1">
                  {extensionCategories
                    .find((cat) => cat.id === "block")
                    ?.items.map((type) => {
                      const TypeIcon = type.icon
                      const isActive = currentFilter === type.id
                      const count = _scripts.filter(
                        (s) => s.meta?.type === type.id
                      ).length

                      if (count === 0) return null

                      return (
                        <button
                          key={type.id}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md py-1.5 text-sm transition-colors",
                            "pl-9 pr-3", // 对齐主文件夹的主图标位置
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                          onClick={() => handleSetFilter(type.id)}
                        >
                          <TypeIcon size={16} />
                          <span className="flex-1 text-left">{type.name}</span>
                          <span className="text-xs opacity-70">{count}</span>
                        </button>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-xl font-semibold">
                {getCurrentCategoryName()}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="enabled-only"
                  checked={currentShowEnabledOnly}
                  onCheckedChange={handleSetShowEnabledOnly}
                />
                <Label
                  className="text-sm text-muted-foreground"
                  htmlFor="enabled-only"
                >
                  Enabled only
                </Label>
              </div>
              <Input
                className="h-9 w-64"
                placeholder="Search extensions..."
                value={currentSearchTerm}
                onChange={(e) => handleSetSearchTerm(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(storeURL, "_blank")}
              >
                Install
              </Button>
              <NewExtensionButton />
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {filterExts.length > 0 ? (
              <div className="grid gap-3">
                {filterExts.map((script) => (
                  <ExtensionListItem
                    key={script.id}
                    script={script}
                    space={space}
                    onDelete={handleDelete}
                    onToggleEnabled={handleToggleEnabled}
                    onAddToSidebar={handleAddToSidebar}
                    onOpenStandalone={handleOpenStandalone}
                    onToggleFavorite={
                      isBlockType(script) ? handleToggleFavorite : undefined
                    }
                    isFavorite={
                      isBlockType(script) ? isFavorite(script.id) : undefined
                    }
                    showReload={Boolean(dirHandle) && scriptId === script.id}
                    onReload={handleReload}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-muted-foreground text-sm">
                  {currentSearchTerm
                    ? "No extensions match your search"
                    : "No extensions found"}
                </div>
                {currentSearchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetSearchTerm("")}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
