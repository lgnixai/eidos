import { forwardRef } from "react"
import { useTranslation } from "react-i18next"

import { useMblock } from "@/hooks/use-mblock"
import { isDesktopMode } from "@/lib/env"

import { type BlockRendererRef } from "./block-renderer"

export const ExtNodeBlockApp = forwardRef<
  BlockRendererRef,
  {
    space: string
    blockId: string
    nodeId: string
  }
>(({ space, blockId, nodeId }, ref) => {
  const { t } = useTranslation()
  const block = useMblock(blockId)
  if (!block) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-sm text-gray-500">
          {t("common.tips.notFoundBlock")}
        </div>
      </div>
    )
  }
  if (!isDesktopMode) {
    return <div>ExtNode only works on desktop</div>
  }

  const extUrl = `http://${blockId}.ext.${space}.eidos.localhost:13127/${nodeId}`
  if (isDesktopMode) {
    return (
      <webview
        src={extUrl}
        style={{
          height: "100%",
          width: "100%",
        }}
        autosize
      />
    )
  }
})

ExtNodeBlockApp.displayName = "ExtNodeBlockApp"
