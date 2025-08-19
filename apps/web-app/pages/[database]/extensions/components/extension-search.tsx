import { Input } from "@/components/ui/input"
import { SearchIcon } from "lucide-react"
import { useAllExtensions } from "@/apps/web-app/hooks/use-all-extensions"

interface ExtensionSearchProps {
  onExit: () => void
}

export const ExtensionSearch = ({ onExit }: ExtensionSearchProps) => {
  const { searchTerm, updateSearch } = useAllExtensions()

  const handleSearchChange = (term: string) => {
    updateSearch(term)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault()
      // 先清空搜索条件
      updateSearch("")
      // 然后退出搜索状态
      onExit()
    }
  }

  return (
    <div className="relative mt-2">
      <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Search extensions..."
        value={searchTerm}
        onChange={(e) => handleSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pl-8 h-8 text-sm"
        autoFocus
      />
    </div>
  )
}
