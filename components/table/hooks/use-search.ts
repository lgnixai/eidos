import { useThrottleFn } from "ahooks"
import { useContext, useEffect, useRef, useState } from "react"
import { TableContext } from "../hooks"
import { useReadonlySqlite } from "@/hooks/use-readonly-sqlite"

const MIN_SEARCH_LENGTH = 2
const PAGE_SIZE = 20

export const useSearch = (viewId: string) => {
    const sqlite = useReadonlySqlite()
    const {
        searchQuery,
        setSearchQuery,
        showSearch,
        currentSearchIndex,
        setCurrentSearchIndex,
        setShowSearch,
        tableName,
        setSearchResults,
        setTotalMatches,
        setSearchTime,
        currentPage,
        setCurrentPage,
    } = useContext(TableContext)

    const searchAbortController = useRef<AbortController | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const searchCache = useRef<Map<string, any>>(new Map())

    const performSearch = async (query: string, page: number = 1) => {
        if (!sqlite || !tableName || !query || !viewId || query.length < MIN_SEARCH_LENGTH) {
            setSearchResults(null)
            setSearchTime(0)
            setCurrentSearchIndex(0)
            setCurrentPage(1)
            return
        }

        const cacheKey = `${tableName}-${query}-${viewId}-${page}`
        if (searchCache.current.has(cacheKey)) {
            const cachedResult = searchCache.current.get(cacheKey)
            setSearchResults(cachedResult.results)
            setSearchTime(cachedResult.searchTime)
            setTotalMatches(cachedResult.totalMatches)
            setCurrentSearchIndex(0)
            return
        }

        if (searchAbortController.current) {
            searchAbortController.current.abort()
        }
        searchAbortController.current = new AbortController()

        try {
            setIsSearching(true)
            const result = await sqlite.searchTableFTS(tableName, query, viewId, page, PAGE_SIZE)

            searchCache.current.set(cacheKey, result)

            if (page === 1) {
                setSearchResults(result.results)
            } else {
                setSearchResults(prev => ([...(prev ?? []), ...result.results]))
            }
            setSearchTime(result.searchTime)
            setTotalMatches(result.totalMatches)
            setCurrentSearchIndex(0)
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return
            }
            console.error('Search error:', error)
            setSearchResults(null)
            setSearchTime(0)
            setCurrentSearchIndex(0)
        } finally {
            setIsSearching(false)
        }
    }

    const { run: throttledSearch } = useThrottleFn(
        (query: string) => performSearch(query, 1),
        { wait: 500 }
    )

    useEffect(() => {
        throttledSearch(searchQuery)
    }, [searchQuery])

    // 监听页码变化
    useEffect(() => {
        if (currentPage > 1 && searchQuery) {
            performSearch(searchQuery, currentPage)
        }
    }, [currentPage])

    // 清理过期缓存
    useEffect(() => {
        const interval = setInterval(() => {
            searchCache.current.clear()
        }, 5 * 60 * 1000)

        return () => clearInterval(interval)
    }, [])

    return {
        searchQuery,
        setSearchQuery,
        showSearch,
        setShowSearch,
        isSearching,
        loadNextPage: () => setCurrentPage((prev: number) => prev + 1)
    }
}
