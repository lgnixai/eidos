import { useCallback, useEffect, useRef } from "react"
import { useKeyPress } from "ahooks"
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { IView } from "@/lib/store/IView"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { useTableSearch } from "./hooks/use-table-search"
import { useTableSearchStore } from "./hooks/use-table-search-store"

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4 text-muted-foreground"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    ></path>
  </svg>
)

export const ViewSearch = (props: { view: IView }) => {
  const { t } = useTranslation()
  const {
    searchQuery,
    setSearchQuery,
    showSearch,
    setShowSearch,
    searchResults,
    currentSearchIndex,
    searchTime,
    totalMatches,
    isLoadingMore,
  } = useTableSearchStore()

  const { isSearching } = useTableSearch(props.view?.id)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus()
    }
  }, [showSearch])

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        searchQuery === ""
      ) {
        setShowSearch(false)
      }
    },
    [searchQuery, setShowSearch]
  )

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [handleClickOutside])

  useKeyPress("esc", () => {
    if (showSearch) {
      setShowSearch(false)
      setSearchQuery("")
    }
  })

  useKeyPress(["ctrl.f", "meta.f"], (event) => {
    event.preventDefault()
    setShowSearch(true)
  })

  const navigateSearch = useCallback(
    (direction: "next" | "prev") => {
      if (searchResults?.length) {
        const navigateEvent = new CustomEvent("navigateSearch", {
          detail: {
            direction,
            currentIndex: currentSearchIndex,
            total: searchResults.length,
          },
        })
        window.dispatchEvent(navigateEvent)
      }
    },
    [currentSearchIndex, searchResults?.length]
  )

  useKeyPress(["enter"], (event) => {
    if (showSearch && searchResults?.length) {
      const direction: "next" | "prev" = event.shiftKey ? "prev" : "next"
      navigateSearch(direction)
    }
  })

  return (
    <div className="relative flex items-center">
      <div
        className={cn(
          "absolute right-0 z-10 flex items-center gap-1",
          "transition-all duration-200 ease-in-out",
          showSearch ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
        )}
      >
        <div
          className={cn(
            "flex h-8 items-center rounded-md border bg-background",
            "overflow-hidden transition-all duration-200 ease-in-out",
            showSearch ? "w-64" : "w-0"
          )}
        >
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={t("common.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-64 border-0 pl-8 pr-24"
          />
          <SearchIcon className="absolute left-2 h-4 w-4 text-muted-foreground" />

          {searchResults && searchResults.length > 0 && (
            <div className="absolute right-2 flex items-center gap-1 bg-background">
              <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
                <span>{currentSearchIndex + 1}</span>
                <span>/</span>
                <span>{totalMatches}</span>
                <span className="ml-2">({searchTime}ms)</span>
              </div>
              <div className="flex">
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-6 w-6 p-0 hover:bg-accent"
                  onClick={() => navigateSearch("prev")}
                >
                  <ChevronUpIcon className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-6 w-6 p-0 hover:bg-accent"
                  onClick={() => navigateSearch("next")}
                >
                  <ChevronDownIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          {isSearching && (
            <div className="absolute right-2 flex items-center">
              <Spinner />
            </div>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="xs"
        className={cn(
          "transition-opacity duration-200",
          showSearch && "opacity-0"
        )}
        onClick={() => setShowSearch(true)}
      >
        <SearchIcon className="h-4 w-4 opacity-60" />
      </Button>

      {isLoadingMore && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
          <span className="text-xs text-muted-foreground">
            Loading more results...
          </span>
        </div>
      )}
    </div>
  )
}
