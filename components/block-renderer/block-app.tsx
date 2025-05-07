import { forwardRef, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { isDesktopMode } from "@/lib/env"
import { getBlockIdFromUrl } from "@/lib/utils"
import { useCurrentNode } from "@/hooks/use-current-node"
import { useCurrentPathInfo } from "@/hooks/use-current-pathinfo"
import { useMblock } from "@/hooks/use-mblock"

import { BlockRenderer, type BlockRendererRef } from "./block-renderer"

export const BlockApp = forwardRef<
  BlockRendererRef,
  { url: string; height?: number }
>(({ url, height }, ref) => {
  const currentNode = useCurrentNode()
  const { t } = useTranslation()
  const { space } = useCurrentPathInfo()
  const { blockId, props, blockSpace } = useMemo(() => {
    const _url = new URL(url)
    const [id, blockSpace] = getBlockIdFromUrl(url).split("@")
    const context = {
      currentNode,
    }
    const props = Object.fromEntries(_url.searchParams.entries()) as Record<
      string,
      any
    >
    props["__context__"] = context
    return {
      blockId: id,
      props: props,
      blockSpace,
    }
  }, [url, currentNode])

  const block = useMblock(blockId)
  if (blockSpace && blockSpace !== space) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-sm text-gray-500">
          {t("common.tips.blockNotInCurrentSpace", {
            space: blockSpace,
          })}
        </div>
      </div>
    )
  }
  if (!block) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-sm text-gray-500">
          {t("common.tips.notFoundBlock")}
        </div>
      </div>
    )
  }

  return (
    <BlockRenderer
      blockId={block.id}
      ref={ref}
      code={block?.ts_code ?? ""}
      compiledCode={block?.code ?? ""}
      env={block?.env_map}
      bindings={block?.bindings}
      defaultProps={props}
      height={height}
    />
  )
})

BlockApp.displayName = "BlockApp"
