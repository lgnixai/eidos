import { useSqlite } from "@/apps/web-app/hooks/use-sqlite"
import type { EidosDataEventChannelMsg } from "@/lib/const";
import { DataUpdateSignalType, EidosDataEventChannelMsgType, EidosDataEventChannelName } from "@/lib/const"
import { ExtensionTableName } from "@/packages/core/sqlite/const"
import type { IExtension } from "@/packages/core/types/IExtension"
import { useCallback, useEffect } from "react"
import { create } from "zustand"

export type ExtensionSortField = "slug" | "created_at" | "updated_at"
export type ExtensionSortOrder = "ASC" | "DESC"

const useExtensionStore = create<{
  extensions: IExtension[]
  loading: boolean
  syncing: boolean
  error: string | null
  sortField: ExtensionSortField
  sortOrder: ExtensionSortOrder
  searchTerm: string
  setExtensions: (extensions: IExtension[]) => void
  addExtension: (extension: IExtension) => void
  updateExtension: (extension: IExtension) => void
  upsertExtension: (extension: IExtension) => void
  removeExtension: (id: string) => void
  setLoading: (loading: boolean) => void
  setSyncing: (syncing: boolean) => void
  setError: (error: string | null) => void
  setSort: (field: ExtensionSortField, order: ExtensionSortOrder) => void
  setSearchTerm: (term: string) => void
  reload?: () => Promise<void>
  setReload: (reload: () => Promise<void>) => void
}>((set, get) => ({
  extensions: [],
  loading: false,
  syncing: false,
  error: null,
  sortField: "created_at",
  sortOrder: "ASC",
  searchTerm: "",
  setExtensions: (extensions) => set({ extensions }),
  addExtension: (extension) => set((state) => {
    // Check if extension already exists to prevent duplicates
    const existingIndex = state.extensions.findIndex(ext => ext.id === extension.id)
    if (existingIndex !== -1) {
      // If exists, update it instead of adding
      return {
        extensions: state.extensions.map(ext =>
          ext.id === extension.id ? extension : ext
        )
      }
    }
    // If doesn't exist, add it
    return {
      extensions: [...state.extensions, extension]
    }
  }),
  updateExtension: (extension) => set((state) => ({
    extensions: state.extensions.map(ext =>
      ext.id === extension.id ? extension : ext
    )
  })),
  upsertExtension: (extension) => set((state) => {
    const existingIndex = state.extensions.findIndex(ext => ext.id === extension.id)
    if (existingIndex !== -1) {
      // Update existing extension
      return {
        extensions: state.extensions.map(ext =>
          ext.id === extension.id ? extension : ext
        )
      }
    } else {
      // Add new extension
      return {
        extensions: [...state.extensions, extension]
      }
    }
  }),
  removeExtension: (id) => set((state) => ({
    extensions: state.extensions.filter(ext => ext.id !== id)
  })),
  setLoading: (loading) => set({ loading }),
  setSyncing: (syncing) => set({ syncing }),
  setError: (error) => set({ error }),
  setSort: (field, order) => set({ sortField: field, sortOrder: order }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setReload: (reload) => set({ reload }),
}))

export const useSyncExtensions = () => {
  const { sqlite } = useSqlite()
  const {
    setExtensions,
    upsertExtension,
    removeExtension,
    setLoading,
    setSyncing,
    setError,
    setReload,
    sortField,
    sortOrder,
    searchTerm
  } = useExtensionStore()

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (!sqlite) return
    try {
      // Build query with search filter
      const query: any = {}
      if (searchTerm.trim()) {
        query.slug = { contains: searchTerm.trim() }
      }

      const res = await sqlite.extension.findMany({
        where: query,
        select: {
          id: true,
          slug: true,
          name: true,
          icon: true,
          type: true,
          enabled: true,
          created_at: true,
          updated_at: true
        },
        orderBy: { [sortField]: sortOrder.toLowerCase() as 'asc' | 'desc' }
      })

      setExtensions(res)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch extensions"
      console.error("Failed to fetch extensions:", error)
      setError(errorMessage)
      setExtensions([])
    } finally {
      setLoading(false)
    }
  }, [sqlite, setExtensions, setLoading, setError, sortField, sortOrder, searchTerm])

  // Register reload function in store
  useEffect(() => {
    setReload(reload)
  }, [reload, setReload])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    const bc = new BroadcastChannel(EidosDataEventChannelName)

    const handler = async (ev: MessageEvent<EidosDataEventChannelMsg>) => {
      const { type, payload } = ev.data
      if (type === EidosDataEventChannelMsgType.MetaTableUpdateSignalType) {
        const { table, _new, _old, type: updateType } = payload
        if (table !== ExtensionTableName) return

        setSyncing(true)
        try {
          switch (updateType) {
            case DataUpdateSignalType.Insert:
            case DataUpdateSignalType.Update:
              if (_new) {
                upsertExtension(_new as unknown as IExtension)
              }
              break

            case DataUpdateSignalType.Delete:
              if (_old?.id) {
                removeExtension(_old.id)
              }
              break
            default:
              break
          }
        } finally {
          setSyncing(false)
        }
      }
    }

    bc.addEventListener("message", handler)
    return () => {
      bc.removeEventListener("message", handler)
      bc.close()
    }
  }, [upsertExtension, removeExtension, setSyncing])
}

export const useAllExtensions = () => {
  const { sqlite } = useSqlite()
  const {
    extensions,
    loading,
    syncing,
    error,
    reload,
    sortField,
    sortOrder,
    searchTerm,
    setSort,
    setSearchTerm
  } = useExtensionStore()

  useSyncExtensions()

  const deleteExtension = useCallback(async (id: string) => {
    if (!sqlite) return false
    try {
      await sqlite.extension.del(id)
      return true
    } catch (error) {
      console.error("Failed to delete extension:", error)
      return false
    }
  }, [sqlite])

  const renameExtension = useCallback(async (id: string, newSlug: string) => {
    if (!sqlite) return { success: false, error: "SQLite not available" }

    // Validate slug format
    if (!newSlug || !newSlug.trim()) {
      return { success: false, error: "Slug cannot be empty" }
    }

    // Basic slug validation - alphanumeric, hyphens, underscores
    const slugRegex = /^[a-zA-Z0-9_-]+$/
    if (!slugRegex.test(newSlug.trim())) {
      return { success: false, error: "Slug can only contain letters, numbers, hyphens, and underscores" }
    }

    try {
      // Check if slug already exists
      const existingExtensions = extensions.filter(ext => ext.id !== id)
      const slugExists = existingExtensions.some(ext => ext.slug === newSlug.trim())

      if (slugExists) {
        return { success: false, error: "Slug already exists" }
      }

      // Update the extension with new slug
      await sqlite.extension.set(id, { slug: newSlug.trim() })
      return { success: true }
    } catch (error) {
      console.error("Failed to rename extension:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return { success: false, error: errorMessage }
    }
  }, [sqlite, extensions])

  const updateSort = useCallback((field: ExtensionSortField, order: ExtensionSortOrder) => {
    setSort(field, order)
  }, [setSort])

  const updateSearch = useCallback((term: string) => {
    setSearchTerm(term)
  }, [setSearchTerm])

  return {
    extensions,
    reload,
    loading,
    syncing,
    error,
    deleteExtension,
    renameExtension,
    sortField,
    sortOrder,
    searchTerm,
    updateSort,
    updateSearch
  }
}
