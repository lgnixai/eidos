import { useEffect, useMemo, useRef, useState } from "react"
import {
  BotIcon,
  LucideIcon,
  MoreHorizontalIcon,
  PanelRightIcon,
  PlusIcon,
  ToyBrickIcon,
  Trash2,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { cn, getBlockIdFromUrl } from "@/lib/utils"
import { useCurrentPathInfo } from "@/hooks/use-current-pathinfo"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAllMblocks } from "@/apps/web-app/[database]/scripts/hooks/use-all-mblocks"

import {
  useAppsStore,
  useSpaceAppStore,
} from "../../apps/web-app/[database]/store"
import { BlockContextMenu } from "./block-context-menu"

const DefaultAppInfoMap: Record<
  string,
  {
    icon: LucideIcon | string
    title: string
    description: string
    shortcut?: string
    available: boolean
  }
> = {
  chat: {
    icon: BotIcon,
    title: "Chat with AI",
    description: "Chat with AI",
    // shortcut: "ctrl/cmd + /",
    available: true,
  },
}

export const RightPanelNav = () => {
  const { setIsRightPanelOpen, setCurrentApp, currentApp, setApps } =
    useSpaceAppStore()
  const { apps, addApp, deleteApp } = useAppsStore()
  const { space } = useCurrentPathInfo()
  const { t } = useTranslation()
  const handleAppChange = (app: string) => {
    setCurrentApp(app)
  }
  const handleAddApp = (blockId: string) => {
    const app = `block://${blockId}@${space}`
    addApp(app)
    setCurrentApp(app)
  }
  const displayApps = useMemo(() => {
    return apps.filter((app) => {
      if (app.startsWith("block://")) {
        const id = getBlockIdFromUrl(app)
        const [blockId, blockSpace] = id.split("@")
        return blockSpace === space
      }
      return true
    })
  }, [apps, space])

  const { mblocks } = useAllMblocks()

  const displayMblocks = useMemo(() => {
    return mblocks.filter((mblock) => {
      return !apps.includes(`block://${mblock.id}@${space}`)
    })
  }, [mblocks, apps, space])

  const getAppInfo = (app: string) => {
    if (app.startsWith("block://")) {
      const id = getBlockIdFromUrl(app)
      const [blockId, blockSpace] = id.split("@")
      if (blockSpace !== space) {
        return {
          icon: ToyBrickIcon,
          title: t("common.tips.blockNotInCurrentSpace", {
            space: blockSpace,
          }),
          description: "",
          shortcut: undefined,
          available: false,
        }
      }
      const block = mblocks.find((mblock) => mblock.id === blockId)
      if (!block) {
        return {
          icon: ToyBrickIcon,
          title: t("common.tips.notFoundBlock"),
          description: "",
          shortcut: undefined,
          available: false,
        }
      }
      const icon =
        block.icon && block.icon.startsWith("data:image")
          ? block.icon
          : ToyBrickIcon
      return {
        icon,
        title: block?.name,
        description: block?.description,
        shortcut: undefined,
        available: true,
      }
    }
    return DefaultAppInfoMap[app]
  }
  const updateApp = (app: string, newUrl: string) => {
    const newApps = apps.map((oldUrl) => (oldUrl === app ? newUrl : oldUrl))
    setApps(newApps)
  }

  const [visibleCount, setVisibleCount] = useState(5)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateVisibleCount = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      const availableWidth = containerWidth - 100
      const possibleCount = Math.floor(availableWidth / 40)
      setVisibleCount(Math.max(1, possibleCount))
    }

    const resizeObserver = new ResizeObserver(updateVisibleCount)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div className="flex gap-2 justify-between w-full" ref={containerRef}>
      <div className="flex gap-2 overflow-hidden">
        {displayApps.slice(0, visibleCount).map((app, index) => {
          const appInfo = getAppInfo(app)
          const {
            icon: IconOrUri,
            title,
            description,
            shortcut,
          } = appInfo ?? {}
          const isCurrentApp = app === currentApp
          const isBlock = app.startsWith("block://")
          return (
            <TooltipProvider key={app}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    {isBlock ? (
                      <ContextMenu>
                        <ContextMenuTrigger asChild>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleAppChange(app)}
                            className={cn("rounded-b-none relative", {
                              "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary":
                                isCurrentApp,
                              "opacity-50": !appInfo?.available,
                            })}
                          >
                            {typeof IconOrUri === "string" ? (
                              <img
                                src={IconOrUri}
                                alt={title}
                                className="h-5 w-5"
                              />
                            ) : (
                              IconOrUri && <IconOrUri className="h-5 w-5" />
                            )}
                          </Button>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem
                            onClick={() => {
                              deleteApp(app)
                              setCurrentApp("chat")
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </ContextMenuItem>
                          <BlockContextMenu
                            url={app}
                            setUrl={(newUrl) => updateApp(app, newUrl)}
                          />
                        </ContextMenuContent>
                      </ContextMenu>
                    ) : (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleAppChange(app)}
                        className={cn("rounded-b-none relative", {
                          "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary":
                            isCurrentApp,
                        })}
                      >
                        {typeof IconOrUri === "string" ? (
                          <img
                            src={IconOrUri}
                            alt={title}
                            className="h-5 w-5"
                          />
                        ) : (
                          IconOrUri && <IconOrUri className="h-5 w-5" />
                        )}
                      </Button>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {title} <br />
                    <span
                      className={"ml-auto text-xs tracking-widest opacity-60"}
                    >
                      {shortcut}
                    </span>
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}

        {displayApps.length > visibleCount && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="xs" variant="ghost" className="rounded-b-none">
                <MoreHorizontalIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {displayApps.slice(visibleCount).map((app, index) => {
                const appInfo = getAppInfo(app)
                const { icon: IconOrUri, title } = appInfo ?? {}
                return (
                  <DropdownMenuItem
                    key={app}
                    onClick={() => handleAppChange(app)}
                  >
                    <div className="flex items-center gap-2">
                      {typeof IconOrUri === "string" ? (
                        <img src={IconOrUri} alt={title} className="h-4 w-4" />
                      ) : (
                        IconOrUri && <IconOrUri className="h-4 w-4" />
                      )}
                      <span>{title}</span>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="xs" variant="ghost" className="rounded-b-none">
              <PlusIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {mblocks.length === 0 && (
              <p className="p-2 text-sm text-gray-500">
                There are no blocks in this space. Try to{" "}
                <Link
                  to={`/${space}/extensions`}
                  className="flex items-center gap-2 text-blue-500"
                >
                  <span>create block</span>
                </Link>
              </p>
            )}
            {displayMblocks.map((block) => (
              <DropdownMenuItem
                key={block.id}
                onClick={() => {
                  handleAddApp(block.id)
                }}
              >
                <div className="flex items-center gap-2">
                  {block.icon && block.icon.startsWith("data:image") ? (
                    <img
                      src={block.icon}
                      alt={block.name}
                      className="h-5 w-5"
                    />
                  ) : (
                    <ToyBrickIcon className="h-5 w-5" />
                  )}
                  <span>{block.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="drag-region grow"></div>
      <Button
        size="xs"
        variant="ghost"
        onClick={() => setIsRightPanelOpen(false, -1)}
      >
        <PanelRightIcon className="h-5 w-5" />
      </Button>
    </div>
  )
}
