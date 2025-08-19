import { useCallback, useEffect, useState } from "react"
import { SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { useAllExtensions } from "@/apps/web-app/hooks/use-all-extensions"

interface ExtensionSearchProps {
  onExit: () => void
}

export const ExtensionSearch = ({ onExit }: ExtensionSearchProps) => {
  const { searchTerm, updateSearch } = useAllExtensions()
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

  const DEBOUNCE_DELAY = 200

  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (term: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          updateSearch(term)
        }, DEBOUNCE_DELAY)
      }
    })(),
    [updateSearch]
  )

  const handleSearchChange = (term: string) => {
    setLocalSearchTerm(term)
    debouncedSearch(term)
  }

  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault()
      setLocalSearchTerm("")
      updateSearch("")
      onExit()
    }
  }

  return (
    <div className="relative mt-2">
      <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Search extensions..."
        value={localSearchTerm}
        onChange={(e) => handleSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pl-8 h-8 text-sm"
        autoFocus
      />
    </div>
  )
}
