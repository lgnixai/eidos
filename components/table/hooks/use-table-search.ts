import { useReadonlySqlite } from "@/hooks/use-readonly-sqlite"
import { useThrottleFn } from "ahooks"
import { useContext, useEffect, useRef, useState } from "react"
import { TableContext } from "../hooks"
import { useTableSearchStore } from "./use-table-search-store"

const MIN_SEARCH_LENGTH = 2
const PAGE_SIZE = 200

export const useTableSearch = (viewId: string) => {
    const sqlite = useReadonlySqlite()
    const { tableName } = useContext(TableContext)
    const {
        searchQuery,
        setSearchQuery,
        showSearch,
        setShowSearch,
        setSearchResults,
        searchResults,
        initializeSearchResults,
        currentSearchIndex,
        totalMatches,
        setTotalMatches,
        setSearchTime,
        currentPage,
        setCurrentPage,
        clearSearch
    } = useTableSearchStore()

    const resetSearch = () => {
        clearSearch()
    }

    useEffect(() => {
        if (!showSearch) {
            resetSearch()
        }
    }, [showSearch])

    useEffect(() => {
        resetSearch()
    }, [tableName])

    const searchAbortController = useRef<AbortController | null>(null)
    const [isSearching, setIsSearching] = useState(false)


    const performSearch = async (query: string, page: number = 1) => {
        if (!sqlite || !tableName || !query || !viewId || query.length < MIN_SEARCH_LENGTH) {
            setSearchResults([], 0)
            setSearchTime(0)
            return
        }

        const page2Index = (page - 1) * PAGE_SIZE
        const page2Data = searchResults[page2Index]
        if (page2Data) {
            return
        }

        const maxPage = Math.ceil(totalMatches / PAGE_SIZE)
        if (page > maxPage && totalMatches > 0) {
            return
        }

        if (searchAbortController.current) {
            searchAbortController.current.abort()
        }
        searchAbortController.current = new AbortController()

        try {
            setIsSearching(true)
            const result = await sqlite.searchTableFTS(tableName, query, viewId, page, PAGE_SIZE)

            console.log('search', query, page, result)

            const newOffset = (page - 1) * PAGE_SIZE
            if (page === 1) {
                initializeSearchResults(result.totalMatches)
            }

            setSearchResults(result.results, newOffset)

            setSearchTime(result.searchTime)
            setTotalMatches(result.totalMatches)
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return
            }
            console.error('Search error:', error)
            setSearchResults([], 0)
            setSearchTime(0)
        } finally {
            setIsSearching(false)
        }
    }

    const { run: throttledSearch } = useThrottleFn(
        (query: string) => performSearch(query, 1),
        { wait: 500 }
    )

    useEffect(() => {
        // only search 1st page when query is changed
        throttledSearch(searchQuery)
    }, [searchQuery])

    useEffect(() => {
        if (!searchQuery || totalMatches === 0) return

        const maxPage = Math.ceil(totalMatches / PAGE_SIZE)
        const targetPage = Math.floor(currentSearchIndex / PAGE_SIZE) + 1


        if (targetPage !== currentPage && targetPage <= maxPage) {
            performSearch(searchQuery, targetPage)
            setCurrentPage(targetPage)
        }

    }, [currentSearchIndex, currentPage, totalMatches, searchQuery,])

    return {
        searchQuery,
        setSearchQuery,
        showSearch,
        setShowSearch,
        isSearching,
    }
}
