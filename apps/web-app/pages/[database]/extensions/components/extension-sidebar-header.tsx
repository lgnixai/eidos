import { Button } from "@/components/ui/button"
import { NewExtensionButton } from "./new-extension-button"
import { ExtensionSortDropdown } from "./extension-sort-dropdown"
import { ExtensionSearch } from "./extension-search"
import { PanelLeftCloseIcon, PlusIcon, SearchIcon } from "lucide-react"

interface ExtensionSidebarHeaderProps {
  showSearch: boolean
  onToggleSearch: () => void
  onClose: () => void
  onExitSearch: () => void
}

export const ExtensionSidebarHeader = ({
  showSearch,
  onToggleSearch,
  onClose,
  onExitSearch,
}: ExtensionSidebarHeaderProps) => {
  return (
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
          <ExtensionSortDropdown />

          {/* Search Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onToggleSearch}
          >
            <SearchIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Close Sidebar Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onClose}
        >
          <PanelLeftCloseIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Conditional Search Input */}
      {showSearch && <ExtensionSearch onExit={onExitSearch} />}
    </div>
  )
}
