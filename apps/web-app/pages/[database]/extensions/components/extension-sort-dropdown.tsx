import { CheckIcon, ArrowUpDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  useAllExtensions,
  type ExtensionSortField,
  type ExtensionSortOrder,
} from "@/apps/web-app/hooks/use-all-extensions"

export const ExtensionSortDropdown = () => {
  const { sortField, sortOrder, updateSort } = useAllExtensions()

  const handleSortChange = (
    field: ExtensionSortField,
    order: ExtensionSortOrder
  ) => {
    updateSort(field, order)
  }

  return (
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
  )
}
