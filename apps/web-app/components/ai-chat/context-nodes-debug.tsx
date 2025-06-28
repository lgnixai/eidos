import React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { useContextNodes } from "./hooks/use-context-nodes"

/**
 * Debug component to monitor context nodes state
 * Remove this in production
 */
export const ContextNodesDebug: React.FC = () => {
  const { contextNodes, getCount, clearNodes } = useContextNodes()

  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 p-2  rounded text-xs max-w-sm z-50 bg-primary text-primary-foreground">
      <div className="flex items-center justify-between mb-2 gap-2">
        <span>Context Nodes ({getCount()})</span>
        <Button
          variant="outline"
          size="xs"
          onClick={clearNodes}
          className="h-6 text-xs  text-primary"
        >
          Clear
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {contextNodes.map((node) => (
          <Badge key={node.id} variant="secondary" className="text-xs">
            {node.name || "Untitled"} ({node.type})
          </Badge>
        ))}
        {contextNodes.length === 0 && (
          <span className="text-gray-400">No context nodes</span>
        )}
      </div>
    </div>
  )
}
