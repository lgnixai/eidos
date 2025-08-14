import { useCallback } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useCurrentPathInfo } from "./use-current-pathinfo"

interface FavBlock {
  id: string
  name: string
  icon?: string
  space: string
}

interface FavBlocksStore {
  // Record<space, FavBlock[]>
  favBlocksBySpace: Record<string, FavBlock[]>
  addFavBlock: (space: string, block: Omit<FavBlock, "space">) => boolean
  removeFavBlock: (space: string, blockId: string) => void
  isFavorite: (space: string, blockId: string) => boolean
  getFavBlocks: (space: string) => FavBlock[]
  reorderFavBlocks: (space: string, newOrder: FavBlock[]) => void
}

const useFavBlocksStore = create<FavBlocksStore>()(
  persist(
    (set, get) => ({
      favBlocksBySpace: {},
      
      addFavBlock: (space: string, block: Omit<FavBlock, "space">) => {
        const { favBlocksBySpace } = get()
        const spaceFavBlocks = favBlocksBySpace[space] || []
        
        // Check if block is already in favorites
        if (spaceFavBlocks.some(favBlock => favBlock.id === block.id)) {
          return false // Already exists
        }
        
        const newFavBlock: FavBlock = { ...block, space }
        const updatedSpaceFavBlocks = [...spaceFavBlocks, newFavBlock]
        
        set({
          favBlocksBySpace: {
            ...favBlocksBySpace,
            [space]: updatedSpaceFavBlocks
          }
        })
        
        return true // Successfully added
      },
      
      removeFavBlock: (space: string, blockId: string) => {
        const { favBlocksBySpace } = get()
        const spaceFavBlocks = favBlocksBySpace[space] || []
        
        const updatedSpaceFavBlocks = spaceFavBlocks.filter(
          favBlock => favBlock.id !== blockId
        )
        
        set({
          favBlocksBySpace: {
            ...favBlocksBySpace,
            [space]: updatedSpaceFavBlocks
          }
        })
      },
      
      isFavorite: (space: string, blockId: string) => {
        const { favBlocksBySpace } = get()
        const spaceFavBlocks = favBlocksBySpace[space] || []
        return spaceFavBlocks.some(favBlock => favBlock.id === blockId)
      },
      
      getFavBlocks: (space: string) => {
        const { favBlocksBySpace } = get()
        return favBlocksBySpace[space] || []
      },
      
      reorderFavBlocks: (space: string, newOrder: FavBlock[]) => {
        const { favBlocksBySpace } = get()
        set({
          favBlocksBySpace: {
            ...favBlocksBySpace,
            [space]: newOrder
          }
        })
      }
    }),
    {
      name: "eidos-fav-blocks"
    }
  )
)

export const useFavBlocks = () => {
  const { space } = useCurrentPathInfo()
  const { 
    addFavBlock: _addFavBlock, 
    removeFavBlock: _removeFavBlock, 
    isFavorite: _isFavorite,
    getFavBlocks,
    reorderFavBlocks: _reorderFavBlocks
  } = useFavBlocksStore()

  const favBlocks = getFavBlocks(space)

  const addFavBlock = useCallback(
    (block: Omit<FavBlock, "space">) => {
      return _addFavBlock(space, block)
    },
    [space, _addFavBlock]
  )

  const removeFavBlock = useCallback(
    (blockId: string) => {
      _removeFavBlock(space, blockId)
    },
    [space, _removeFavBlock]
  )

  const isFavorite = useCallback(
    (blockId: string) => {
      return _isFavorite(space, blockId)
    },
    [space, _isFavorite]
  )

  const toggleFavBlock = useCallback(
    (block: Omit<FavBlock, "space">) => {
      if (isFavorite(block.id)) {
        removeFavBlock(block.id)
        return false // Removed
      } else {
        return addFavBlock(block) // Returns true if added, false if already exists
      }
    },
    [isFavorite, removeFavBlock, addFavBlock]
  )

  const reorderFavBlocks = useCallback(
    (newOrder: FavBlock[]) => {
      _reorderFavBlocks(space, newOrder)
    },
    [space, _reorderFavBlocks]
  )

  return {
    favBlocks,
    addFavBlock,
    removeFavBlock,
    isFavorite,
    toggleFavBlock,
    reorderFavBlocks,
  }
} 