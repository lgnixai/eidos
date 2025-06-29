import { useMemo } from "react"
import type { IExtension } from "@/packages/core/meta-table/extension"
import { useQueryParam, StringParam, BooleanParam } from "use-query-params"
import { useMount } from "ahooks"
import {
  FileIcon,
  FolderIcon,
  FunctionSquareIcon,
  PencilRulerIcon,
  SparkleIcon,
  SquareCodeIcon,
  ToyBrickIcon,
} from "lucide-react"
import { useLoaderData, useRevalidator } from "react-router-dom"

import { EIDOS_SPACE_BASE_URL } from "@/lib/const"
import { cn, getExtensionUrl } from "@/lib/utils"
import { useCurrentPathInfo } from "@/apps/web-app/hooks/use-current-pathinfo"
import { useExtension } from "@/apps/web-app/hooks/use-extension"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

import { useAppsStore, useSpaceAppStore } from "../store"
import { ExtensionListItem } from "./components/extension-list-item"
import { NewExtensionButton } from "./components/new-extension-button"
import { useDirHandleStore, useLocalScript } from "./hooks/use-local-script"

export const extensionTypes = [
  {
    id: "all",
    name: "All Extensions",
    icon: FolderIcon,
  },
  {
    id: "m_block",
    name: "Micro Blocks",
    icon: ToyBrickIcon,
  },
  {
    id: "script",
    name: "Scripts",
    icon: SquareCodeIcon,
  },
  {
    id: "ext_node",
    name: "Ext Nodes",
    icon: FileIcon,
  },
  {
    id: "udf",
    name: "UDFs",
    icon: FunctionSquareIcon,
  },
  {
    id: "prompt",
    name: "Prompts",
    icon: SparkleIcon,
  },
  {
    id: "doc_plugin",
    name: "Doc Plugins",
    icon: PencilRulerIcon,
  },
  {
    id: "py_script",
    name: "Python Scripts",
    icon: SquareCodeIcon,
  },
]

export const IconMap = Object.fromEntries(
  extensionTypes.map(({ id, icon }) => [id, icon])
) as Record<string, (typeof extensionTypes)[number]["icon"]>

export const ScriptPage = () => {
  const scripts = useLoaderData() as IExtension[]
  const { space } = useCurrentPathInfo()
  
  const [filter, setFilter] = useQueryParam("filter", StringParam)
  const [searchTerm, setSearchTerm] = useQueryParam("searchTerm", StringParam)
  const [showEnabledOnly, setShowEnabledOnly] = useQueryParam("showEnabledOnly", BooleanParam)

  // Set default values
  const currentFilter = filter || "all"
  const currentSearchTerm = searchTerm || ""
  const currentShowEnabledOnly = showEnabledOnly || false

  const handleSetFilter = (value: string) => {
    setFilter(value === "all" ? undefined : value)
  }
  
  const handleSetSearchTerm = (value: string) => {
    setSearchTerm(value || undefined)
  }
  
  const handleSetShowEnabledOnly = (value: boolean) => {
    setShowEnabledOnly(value || undefined)
  }

  const _scripts = scripts

  const filterExts = useMemo(() => {
    let filtered = _scripts

    // Apply type filter
    if (currentFilter !== "all") {
      filtered = filtered.filter(
        (script) => script.type.toLowerCase() === currentFilter.toLowerCase()
      )
    }

    // Apply search filter
    if (currentSearchTerm) {
      filtered = filtered.filter(
        (script) =>
          script.name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
          script.description.toLowerCase().includes(currentSearchTerm.toLowerCase())
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
      toast({
        title: "Already in Sidebar",
        description: `Micro block "${blockId}" is already in the sidebar.`,
        variant: "default",
      })
      return
    }

    addApp(app)
    setCurrentApp(app)
    toast({
      title: "Added to Sidebar",
      description: `Micro block "${blockId}" has been added to the sidebar.`,
    })
  }

  const handleOpenStandalone = (blockId: string) => {
    // Open micro block in standalone mode (new window/tab)
    const newUrl = getExtensionUrl(blockId, space)
    window.open(newUrl)
  }

  const { dirHandle, scriptId } = useDirHandleStore()
  const { reload } = useLocalScript()

  const handleToggleEnabled = async (script: IExtension, checked: boolean) => {
    const { id } = script
    if (checked) {
      if (
        script.type === "block" &&
        scripts.findIndex((script) => script.id === id) === -1
      ) {
        await addExtension({
          id,
          name: id.replace("block-", ""),
          type: "block",
          description: "Block",
          version: "1.0.0",
          code: "",
          enabled: true,
          commands: [],
        })
      }
      if (
        script.type === "app" &&
        scripts.findIndex((script) => script.id === id) === -1
      ) {
        await addExtension({
          ...script,
          enabled: true,
          commands: [],
        })
      }
      await enableExtension(id)
    } else {
      await disableExtension(id)
    }
    revalidator.revalidate()
  }

  const { toast } = useToast()
  const storeURL = `${EIDOS_SPACE_BASE_URL}/extensions`
  const handleReload = async () => {
    const script = await reload()
    await updateExtension(script)
    revalidator.revalidate()
    toast({
      title: "Script Updated Successfully",
    })
  }
  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-64 flex-shrink-0 border-r p-4">
        <ScrollArea className="h-full">
          {extensionTypes.map((type) => {
            const Icon = type.icon
            const isActive = currentFilter === type.id
            const count =
              type.id === "all"
                ? _scripts.length
                : _scripts.filter((s) => s.type === type.id).length

            return (
              <button
                key={type.id}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => handleSetFilter(type.id)}
              >
                <Icon size={18} />
                <span className="flex-1 text-left">{type.name}</span>
                <span className="text-xs opacity-60">{count}</span>
              </button>
            )
          })}
        </ScrollArea>
      </div>

      {/* Right Content Area */}
      <div className="flex-1">
        <div className="flex items-center justify-between p-4">
          <div className="text-lg font-semibold">
            {extensionTypes.find((t) => t.id === currentFilter)?.name ||
              "All Extensions"}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Label
                className="text-sm text-muted-foreground"
                htmlFor="enabled-only"
              >
                Enabled Only
              </Label>
              <Switch
                id="enabled-only"
                checked={currentShowEnabledOnly}
                onCheckedChange={handleSetShowEnabledOnly}
              />
            </div>
            <Input
              className="h-[32px] w-[200px]"
              placeholder="Search extension..."
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
        <Separator />
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="divide-y">
            {filterExts.map((script) => (
              <ExtensionListItem
                key={script.id}
                script={script}
                space={space}
                onDelete={handleDelete}
                onToggleEnabled={handleToggleEnabled}
                onAddToSidebar={handleAddToSidebar}
                onOpenStandalone={handleOpenStandalone}
                showReload={Boolean(dirHandle) && scriptId === script.id}
                onReload={handleReload}
              />
            ))}
            {filterExts.length === 0 && (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No extensions found
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
