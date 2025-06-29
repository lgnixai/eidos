import { useAppRuntimeStore } from "@/apps/web-app/store/runtime-store"

export const useAPIAgent = () => {
  const { isWebsocketConnected } = useAppRuntimeStore()

  return {
    connected: isWebsocketConnected,
  }
}
