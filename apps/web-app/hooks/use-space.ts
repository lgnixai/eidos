import { useCallback, useEffect, useState } from "react"

import { useLastOpened } from "@/apps/web-app/pages/[database]/hook"
import { MsgType } from "@/lib/const"
import { getWorker } from "@/packages/core/sqlite/worker"
import { SpaceFileSystem } from "@/lib/storage/space"
import { uuidv7 } from "@/lib/utils"

import { isDesktopMode } from "@/lib/env"
import { useSqlite, useSqliteStore } from "./use-sqlite"

export const useSpaceFileSystem = () => {
  const spaceFileSystem = isDesktopMode
    ? window.eidos.spaceFileSystem
    : new SpaceFileSystem()
  return { spaceFileSystem }
}

export type SpaceInfo = {
  isSyncEnabled: boolean
  graftId?: string
}

export const useSpaceInfo = (spaceName: string) => {
  const { spaceFileSystem } = useSpaceFileSystem()
  const [spaceInfo, setSpaceInfo] = useState<SpaceInfo | null>(null)
  const getSpaceInfo = useCallback(async (spaceName: string) => {
    if (!spaceName) {
      setSpaceInfo(null)
      return
    }
    const info = await spaceFileSystem.getSpaceInfo(spaceName)
    setSpaceInfo(info)
  }, [spaceName])

  useEffect(() => {
    getSpaceInfo(spaceName)
  }, [getSpaceInfo, spaceName])

  return { getSpaceInfo, spaceInfo }
}

export const useSpace = () => {
  const { setSpaceList, spaceList } = useSqliteStore()
  const { sqlite } = useSqlite()
  const { setLastOpenedDatabase } = useLastOpened()
  const { spaceFileSystem } = useSpaceFileSystem()
  const updateSpaceList = useCallback(async () => {
    const spaceNames = await spaceFileSystem.list()
    setSpaceList(spaceNames)
  }, [setSpaceList])

  useEffect(() => {
    updateSpaceList()
  }, [setSpaceList, updateSpaceList])

  const exportSpace = useCallback(async (spaceName: string) => {
    await spaceFileSystem.export(spaceName)
  }, [])


  const deleteSpace = useCallback(
    async (spaceName: string) => {
      try {
        await spaceFileSystem.remove(spaceName)
        setLastOpenedDatabase("")

        await new Promise(resolve => setTimeout(resolve, 100))

        const spaceNames = await spaceFileSystem.list()
        if (spaceNames.includes(spaceName)) {
          console.warn(`Space ${spaceName} still exists after deletion attempt`)
        }
        setSpaceList(spaceNames)
      } catch (error) {
        console.error("Error deleting space:", error)
        throw error
      }
    },
    [setLastOpenedDatabase, spaceFileSystem]
  )

  const rebuildIndex = useCallback(async () => {
    await sqlite?.doc.rebuildIndex({
      recreateFtsTable: true
    })
  }, [])

  const createSpace = useCallback(async (spaceName: string, enableSync: boolean = false, volumeId?: string) => {
    await spaceFileSystem.create(spaceName)

    if (isDesktopMode) {
      const res = await window.eidos.invoke(MsgType.CreateSpace, { spaceName, enableSync, volumeId })
      return res
    } else {
      const msgId = uuidv7()
      const worker = getWorker()

      const channel = new MessageChannel()
      worker.postMessage(
        {
          type: MsgType.CreateSpace,
          data: {
            spaceName,
          },
          id: msgId,
        },
        [channel.port2]
      )
      return new Promise((resolve) => {
        channel.port1.onmessage = (e) => {
          if (e.data.id === msgId) {
            resolve(e.data.data)
          }
          // close the channel
          channel.port1.close()
        }
      })
    }
  }, [])

  return {
    spaceList,
    updateSpaceList,
    createSpace,
    exportSpace,
    deleteSpace,
    rebuildIndex,
  }
}
