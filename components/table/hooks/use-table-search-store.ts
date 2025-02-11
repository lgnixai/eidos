import { create } from 'zustand'

export interface SearchMatch {
    column: string
    snippet: string
}

export interface SearchResult {
    row: Record<string, any>
    matches: SearchMatch[]
    rowIndex: number
}

interface TableSearchState {
    searchQuery: string
    showSearch: boolean
    searchResults: SearchResult[]
    currentSearchIndex: number
    totalMatches: number
    searchTime: number
    currentPage: number
    totalPages: number
    isLoadingMore: boolean
    setSearchQuery: (query: string) => void
    setShowSearch: (show: boolean) => void
    setSearchResults: (results: SearchResult[], startIndex: number) => void
    initializeSearchResults: (total: number) => void
    setCurrentSearchIndex: (value: number | ((prev: number) => number)) => void
    setTotalMatches: (total: number) => void
    setSearchTime: (time: number) => void
    setCurrentPage: (page: number) => void
    clearSearch: () => void
}

export const useTableSearchStore = create<TableSearchState>((set) => ({
    searchQuery: '',
    showSearch: false,
    searchResults: [],
    currentSearchIndex: 0,
    totalMatches: 0,
    searchTime: 0,
    currentPage: 1,
    totalPages: 0,
    isLoadingMore: false,
    setSearchQuery: (query) => set({ searchQuery: query }),
    setShowSearch: (show) => set({ showSearch: show }),
    setSearchResults: (results, startIndex) => set((state) => {
        const newResults = state.searchResults.slice()
        newResults.splice(startIndex, results.length, ...results)
        return { searchResults: newResults }
    }),
    initializeSearchResults: (total) => set({
        searchResults: new Array(total)
    }),
    setCurrentSearchIndex: (value) => set((state) => ({
        currentSearchIndex: typeof value === 'function' ? value(state.currentSearchIndex) : value
    })),
    setTotalMatches: (total) => set({ totalMatches: total }),
    setSearchTime: (time) => set({ searchTime: time }),
    setCurrentPage: (page) => set({ currentPage: page }),
    clearSearch: () => set({
        searchQuery: '',
        showSearch: false,
        searchResults: [],
        currentSearchIndex: 0,
        totalMatches: 0,
        searchTime: 0,
        currentPage: 1
    })
})) 