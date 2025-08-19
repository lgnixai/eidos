import { useEffect, useMemo, useRef, useState } from "react"
import { useVirtualList } from "ahooks"
import {
  ArrowUpDownIcon,
  CheckIcon,
  CopyIcon,
  PanelLeftCloseIcon,
  PencilLineIcon,
  PinIcon,
  PinOffIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { EIDOS_SPACE_BASE_URL } from "@/lib/const"
import { cn } from "@/lib/utils"
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
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import {
  useAllExtensions,
  type ExtensionSortField,
  type ExtensionSortOrder,
} from "@/apps/web-app/hooks/use-all-extensions"
import { useCurrentPathInfo } from "@/apps/web-app/hooks/use-current-pathinfo"
import { useFavBlocks } from "@/apps/web-app/hooks/use-fav-blocks"

import { useExtensionSidebarStore } from "../stores/sidebar-store"
import { NewExtensionButton } from "./new-extension-button"

interface ExtensionSidebarProps {
  className?: string
}

export const ExtensionSidebar = ({ className }: ExtensionSidebarProps) => {
  const { space } = useCurrentPathInfo()
  const { scriptId } = useParams()
  const { toast } = useToast()
  const navigate = useNavigate()
  const {
    extensions: allExtensions,
    deleteExtension,
    renameExtension,
    sortField,
    sortOrder,
    updateSort,
    searchTerm,
    updateSearch,
  } = useAllExtensions()
  const { isFavorite, toggleFavBlock } = useFavBlocks()
  const [showSearch, setShowSearch] = useState(false)
  const [renamingExtension, setRenamingExtension] = useState<{
    id: string
    currentSlug: string
  } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [newSlug, setNewSlug] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)
  const editableRef = useRef<HTMLSpanElement>(null)
  const {
    isSidebarOpen,
    toggleSidebar,
    focusedExtensionId,
    setFocusedExtensionId,
  } = useExtensionSidebarStore()

  // Initialize contentEditable content when entering rename mode
  useEffect(() => {
    if (renamingExtension && editableRef.current) {
      const element = editableRef.current
      element.textContent = renamingExtension.currentSlug

      // Use setTimeout to ensure DOM is updated before focusing and selecting
      setTimeout(() => {
        element.focus()

        // Select all text
        const range = document.createRange()
        range.selectNodeContents(element)
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }, 0)
    }
  }, [renamingExtension])

  // Handle extension deletion with navigation
  const handleDeleteExtension = async (id: string) => {
    const success = await deleteExtension(id)
    if (success) {
      // Navigate to extensions index page after successful deletion
      navigate(`/${space}/extensions`)
    } else {
      // Show error toast if deletion failed
      toast({
        title: "Failed to delete extension",
        description: "An error occurred while deleting the extension",
        variant: "destructive",
      })
    }
  }

  const handleRenameExtension = (extensionId: string, currentSlug: string) => {
    setRenamingExtension({ id: extensionId, currentSlug })
    setNewSlug(currentSlug)
  }

  const handleConfirmRename = async () => {
    if (!renamingExtension || !newSlug.trim() || isRenaming) return

    setIsRenaming(true)
    const result = await renameExtension(renamingExtension.id, newSlug.trim())

    if (result.success) {
      // Silent success - no toast notification for routine operations
      setRenamingExtension(null)
      setNewSlug("")
    } else {
      // Show toast only for errors
      toast({
        title: "Failed to rename extension",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsRenaming(false)
  }

  const handleCancelRename = () => {
    setRenamingExtension(null)
    setNewSlug("")
    setIsRenaming(false)
  }

  // Handle sort changes
  const handleSortChange = (
    field: ExtensionSortField,
    order: ExtensionSortOrder
  ) => {
    updateSort(field, order)
  }

  // Handle search changes
  const handleSearchChange = (term: string) => {
    updateSearch(term)
  }

  const [list, scrollTo] = useVirtualList(allExtensions, {
    containerTarget: containerRef,
    wrapperTarget: wrapperRef,
    itemHeight: 32,
    overscan: 5,
  })
  // Handle scrolling to focused extension
  useEffect(() => {
    if (focusedExtensionId && allExtensions.length > 0) {
      const extensionIndex = allExtensions.findIndex(
        (ext) => ext.id === focusedExtensionId
      )

      if (extensionIndex !== -1) {
        // Use setTimeout to ensure the virtual list has been updated
        setTimeout(() => {
          scrollTo(extensionIndex)
          // Clear the focus after scrolling
          setFocusedExtensionId(null)
        }, 100)
      }
    }
  }, [focusedExtensionId, allExtensions, scrollTo, setFocusedExtensionId])

  // Don't render if sidebar is closed
  if (!isSidebarOpen) {
    return null
  }

  return (
    <div
      className={cn(
        "w-64 flex-shrink-0 border-r bg-muted/20 flex flex-col h-full px-2",
        className
      )}
    >
      {/* Header with Icon Triggers */}
      <div className="p-1 border-b flex-shrink-0">
        {/* Icon Buttons Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Create Extension Dropdown */}
            <NewExtensionButton
              trigger={
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <PlusIcon className="h-4 w-4" />
                </Button>
              }
            />

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowUpDownIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  onClick={() => handleSortChange("slug", "ASC")}
                  className={cn(
                    sortField === "slug" && sortOrder === "ASC" && "bg-accent"
                  )}
                >
                  <span className="flex-1 whitespace-nowrap">Slug A-Z</span>
                  {sortField === "slug" && sortOrder === "ASC" && (
                    <CheckIcon className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSortChange("slug", "DESC")}
                  className={cn(
                    sortField === "slug" && sortOrder === "DESC" && "bg-accent"
                  )}
                >
                  <span className="flex-1 whitespace-nowrap">Slug Z-A</span>
                  {sortField === "slug" && sortOrder === "DESC" && (
                    <CheckIcon className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSortChange("created_at", "DESC")}
                  className={cn(
                    sortField === "created_at" &&
                      sortOrder === "DESC" &&
                      "bg-accent"
                  )}
                >
                  <span className="flex-1 whitespace-nowrap">Newest First</span>
                  {sortField === "created_at" && sortOrder === "DESC" && (
                    <CheckIcon className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSortChange("created_at", "ASC")}
                  className={cn(
                    sortField === "created_at" &&
                      sortOrder === "ASC" &&
                      "bg-accent"
                  )}
                >
                  <span className="flex-1 whitespace-nowrap">Oldest First</span>
                  {sortField === "created_at" && sortOrder === "ASC" && (
                    <CheckIcon className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSortChange("updated_at", "DESC")}
                  className={cn(
                    sortField === "updated_at" &&
                      sortOrder === "DESC" &&
                      "bg-accent"
                  )}
                >
                  <span className="flex-1 whitespace-nowrap">
                    Recently Updated
                  </span>
                  {sortField === "updated_at" && sortOrder === "DESC" && (
                    <CheckIcon className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSortChange("updated_at", "ASC")}
                  className={cn(
                    sortField === "updated_at" &&
                      sortOrder === "ASC" &&
                      "bg-accent"
                  )}
                >
                  <span className="flex-1 whitespace-nowrap">
                    Least Updated
                  </span>
                  {sortField === "updated_at" && sortOrder === "ASC" && (
                    <CheckIcon className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowSearch(!showSearch)}
            >
              <SearchIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Close Sidebar Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={toggleSidebar}
          >
            <PanelLeftCloseIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Conditional Search Input */}
        {showSearch && (
          <div className="relative mt-2">
            <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search extensions..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 h-8 text-sm"
              autoFocus
            />
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full" ref={containerRef}>
          <div ref={wrapperRef} className="h-full p-1">
            {list.map((item) => {
              const extension = item.data
              const isActive = extension.id === scriptId

              return (
                <div
                  key={extension.slug}
                  style={{
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 2,
                  }}
                >
                  <ContextMenu>
                    <ContextMenuTrigger className="w-full">
                      {renamingExtension?.id === extension.id ? (
                        <div className="flex items-center gap-2 rounded-sm px-2 py-1 text-sm transition-colors w-full text-foreground bg-muted/80">
                          <span
                            ref={
                              renamingExtension?.id === extension.id
                                ? editableRef
                                : null
                            }
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            className="flex-1 outline-none cursor-text"
                            data-extension-id={extension.id}
                            tabIndex={0}
                            spellCheck={false}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                e.stopPropagation()
                                const newText =
                                  e.currentTarget.textContent || ""
                                setNewSlug(newText)
                                handleConfirmRename()
                              } else if (e.key === "Escape") {
                                e.preventDefault()
                                e.stopPropagation()
                                // Reset content to original value
                                e.currentTarget.textContent =
                                  renamingExtension?.currentSlug || ""
                                handleCancelRename()
                              }
                              // For all other keys, let the default behavior happen (typing)
                            }}
                            onBlur={(e) => {
                              const newText = e.currentTarget.textContent || ""
                              setNewSlug(newText)
                              if (!isRenaming) {
                                handleConfirmRename()
                              }
                            }}
                            onInput={(e) => {
                              // Update React state as user types, but don't interfere with contentEditable
                              const newText = e.currentTarget.textContent || ""
                              setNewSlug(newText)
                            }}
                          >
                            {/* Initial content set by useEffect, then controlled by user input */}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            .{extension.type === "script" ? "ts" : "tsx"}
                          </span>
                        </div>
                      ) : (
                        <Link
                          to={`/${space}/extensions/${extension.id}`}
                          className={cn(
                            "flex items-center gap-2 rounded-sm px-2 py-1 text-sm transition-colors w-full text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20",
                            isActive ? "bg-muted/80" : "hover:bg-muted/80"
                          )}
                          onKeyDown={(e) => {
                            // Keyboard shortcuts for rename:
                            // - Enter: Trigger rename (primary shortcut)
                            // - F2: Trigger rename (Windows/VS Code pattern)
                            if (e.key === "Enter") {
                              e.preventDefault()
                              e.stopPropagation()
                              handleRenameExtension(
                                extension.id,
                                extension.slug
                              )
                            } else if (e.key === "F2") {
                              e.preventDefault()
                              e.stopPropagation()
                              handleRenameExtension(
                                extension.id,
                                extension.slug
                              )
                            }
                            // Let other keys (like Enter alone) work normally for navigation
                          }}
                        >
                          {/* {extension.icon && (
                              <span className="text-base leading-none flex-shrink-0">
                                {extension.icon}
                              </span>
                            )} */}
                          <span className="flex-1 truncate">
                            {extension.slug}.
                            {extension.type === "script" ? "ts" : "tsx"}
                          </span>

                          {/* show pin icon if it is pinned */}
                          {isFavorite(extension.id) && (
                            <PinIcon className="mr-2 h-4 w-4" />
                          )}
                        </Link>
                      )}
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      {extension.type === "block" && (
                        <ContextMenuItem
                          onSelect={() => {
                            toggleFavBlock({
                              id: extension.id,
                              name: extension.name,
                              icon: extension.icon,
                            })
                          }}
                        >
                          {isFavorite(extension.id) ? (
                            <PinOffIcon className="mr-2 h-4 w-4" />
                          ) : (
                            <PinIcon className="mr-2 h-4 w-4" />
                          )}
                          {isFavorite(extension.id) ? "Unpin" : "Pin"}
                        </ContextMenuItem>
                      )}
                      <ContextMenuItem
                        onSelect={() =>
                          handleRenameExtension(extension.id, extension.slug)
                        }
                      >
                        <PencilLineIcon className="mr-2 h-4 w-4" />
                        Rename
                      </ContextMenuItem>
                      <ContextMenuItem
                        onSelect={() => {
                          const slug = `${extension.slug}`
                          navigator.clipboard.writeText(slug)
                          toast({
                            title: "Slug copied to clipboard",
                            description: slug,
                          })
                        }}
                      >
                        <CopyIcon className="mr-2 h-4 w-4" />
                        Copy Slug
                      </ContextMenuItem>
                      <ContextMenuItem
                        onSelect={() => handleDeleteExtension(extension.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2Icon className="mr-2 h-4 w-4" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </div>
              )
            })}

            {allExtensions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 px-2 text-center">
                <div className="text-muted-foreground text-xs mb-2">
                  {searchTerm
                    ? "No matching extensions"
                    : "No extensions found"}
                </div>
                {!searchTerm && (
                  <button
                    onClick={() =>
                      window.open(
                        `${EIDOS_SPACE_BASE_URL}/extensions`,
                        "_blank"
                      )
                    }
                    className="text-xs text-primary hover:underline"
                  >
                    Browse Store
                  </button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
