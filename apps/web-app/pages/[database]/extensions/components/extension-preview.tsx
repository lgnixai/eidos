import { forwardRef } from "react"
import type { IExtension } from "@/packages/core/meta-table/extension"

import { Button } from "@/components/ui/button"
import { BlockRenderer } from "@/components/block-renderer/block-renderer"

interface ExtensionPreviewProps {
  script: IExtension
  currentCompiledDraftCode: string
  height?: number
  onCompileAndSubmit: () => Promise<void>
}

export const ExtensionPreview = forwardRef<
  HTMLDivElement,
  ExtensionPreviewProps
>(({ script, currentCompiledDraftCode, height, onCompileAndSubmit }, ref) => {
  if (!script.code) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          No preview available. Build first to see the preview.
        </p>
        <Button onClick={onCompileAndSubmit} size="sm">
          Build
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full" ref={ref}>
      {script.type === "block" && (
        <BlockRenderer
          blockId={script.id}
          code={script.ts_code || ""}
          compiledCode={currentCompiledDraftCode || script.code || ""}
          env={{}}
          bindings={{}}
          height={height}
        />
      )}

      {/* New architecture support */}
      {script.type === "block" && (
        <BlockRenderer
          blockId={script.id}
          code={script.ts_code || ""}
          compiledCode={currentCompiledDraftCode || script.code || ""}
          env={{}}
          bindings={{}}
          height={height}
        />
      )}

      {script.type === "script" && (
        <div className="h-full overflow-auto p-2">
          <div className="text-sm text-muted-foreground">
            Script extensions run in the background and don't have a visual
            preview.
          </div>
        </div>
      )}
    </div>
  )
})

ExtensionPreview.displayName = "ScriptPreview"
