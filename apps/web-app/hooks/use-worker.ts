import React, { useCallback } from "react"

import { Markdown } from "@/components/remix-chat/components/markdown"
import { useToast } from "@/components/ui/use-toast"
import { useSqlite } from "@/apps/web-app/hooks/use-sqlite"
import { EidosMessageChannelName, MsgType } from "@/lib/const"
import { getEmbeddingWorker } from "@/lib/embedding/worker"
import { isDesktopMode, isInkServiceMode } from "@/lib/env"
import { getWorker } from "@/packages/core/sqlite/worker"
import { useAppRuntimeStore } from "@/apps/web-app/store/runtime-store"

import { useThemeStore } from "@/apps/web-app/store/theme-store"
import {
  _convertEmail2State,
  _convertHtml2State,
  _convertMarkdown2State,
  _getDocMarkdown,
} from "./use-doc-editor"
import { useSqliteStore } from "./use-sqlite"
import { useCurrentUser } from "./user-current-user"

export const useWorker = () => {
  const { setInitialized, isInitialized } = useSqliteStore()
  const { id: userId } = useCurrentUser()
  const { } = useSqlite
  const {
    setWebsocketConnected,
    setBlockUIMsg,
    setBlockUIData,
    setEmbeddingModeLoaded,
  } = useAppRuntimeStore()
  const { setCurrentThemeName, listThemes, setCustomTheme, getCustomTheme, applyTheme } = useThemeStore()

  const { toast } = useToast()
  const initWorker = useCallback(() => {
    if (isInkServiceMode) {
      setInitialized(true)
      return () => { }
    }
    const handle = async (event: MessageEvent) => {
      if (event.data === "init") {
        console.log("sqlite is loaded")
        setInitialized(true)
      }
      const { type, data } = event.data
      console.log("handle", type, data)
      let res = null
      switch (type) {
        case MsgType.WebSocketConnected:
          setWebsocketConnected(true)
          break
        case MsgType.WebSocketDisconnected:
          setWebsocketConnected(false)
          break
        case MsgType.Notify:
          toast({
            title: data.title,
            description: React.createElement(Markdown, { children: data.description }),
          })
          break
        case MsgType.BlockUIMsg:
          setBlockUIMsg(data.msg)
          setBlockUIData(data.data)
          break
        case MsgType.Error:
          toast({
            title: "Error",
            description: data.message,
            duration: 5000,
          })
          break
        case MsgType.GetDocMarkdown:
          res = await _getDocMarkdown(data)
          break
        case MsgType.ConvertMarkdown2State:
          res = await _convertMarkdown2State(data)
          break
        case MsgType.ConvertHtml2State:
          res = await _convertHtml2State(data)
          break
        case MsgType.ConvertEmail2State:
          res = await _convertEmail2State(data.email, data.space, userId)
          break
        case MsgType.GetTheme:
          res = getCustomTheme(data)
          break
        case MsgType.SetTheme:
          res = setCustomTheme(data.name, data.css)
          break
        case MsgType.ListThemes:
          res = listThemes()
          break
        case MsgType.SetCurrentTheme:
          res = setCurrentThemeName(data)
          break
        case MsgType.ApplyTheme:
          res = applyTheme(data.name, data.css)
          break
        default:
          break
      }
      console.log("res", res)
      event?.ports[0]?.postMessage(res)
      return res
    }

    const requestHandler = async (event: any, requestId: string, arg: any) => {
      // console.log('request-from-main', requestId, arg)
      const result = await handle(new MessageEvent("message", { data: arg }))
      // console.log('response-from-main', requestId, result)
      window.eidos.send(`response-${requestId}`, result)
    }
    let listenerId: string | undefined
    let listenerId2: string | undefined
    if (isDesktopMode) {
      listenerId = window.eidos.on("request-from-main", requestHandler)
      listenerId2 = window.eidos.on(
        EidosMessageChannelName,
        async (event, arg) => {
          await handle(new MessageEvent("message", { data: arg }))
        }
      ) as unknown as string
      setInitialized(true)
    } else {
      const worker = getWorker()
      worker.addEventListener("message", handle)
    }
    return () => {
      if (isDesktopMode) {
        if (listenerId) {
          window.eidos.off("request-from-main", listenerId)
        }
        if (listenerId2) {
          window.eidos.off(EidosMessageChannelName, listenerId2)
        }
      } else {
        const worker = getWorker()
        worker.removeEventListener("message", handle)
      }
    }
  }, [
    setBlockUIData,
    setBlockUIMsg,
    setInitialized,
    setWebsocketConnected,
    toast,
    userId,
  ])

  const initEmbeddingWorker = useCallback(() => {
    const worker = getEmbeddingWorker()
    const handler = async (event: MessageEvent) => {
      if (event.data.status === "ready") {
        console.log("embedding worker is ready")
        setEmbeddingModeLoaded(true)
      }
    }
    worker.addEventListener("message", handler)
    return () => worker.removeEventListener("message", handler)
  }, [setEmbeddingModeLoaded])

  return {
    initEmbeddingWorker,
    initWorker,
    isInitialized,
  }
}
