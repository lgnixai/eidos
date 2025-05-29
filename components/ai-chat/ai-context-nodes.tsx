import { XIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { ITreeNode } from "@/lib/store/ITreeNode"
import { isDayPageId } from "@/lib/utils"
import { useCurrentPathInfo } from "@/hooks/use-current-pathinfo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NodeName } from "@/components/node-name"

interface AIContextNodesProps {
  contextNodes: ITreeNode[]
  onRemoveNode: (nodeId: string) => void
}

export const AIContextNodes = ({
  contextNodes,
  onRemoveNode,
}: AIContextNodesProps) => {
  const navigate = useNavigate()
  const { space } = useCurrentPathInfo()

  if (!contextNodes || contextNodes.length === 0) {
    return null
  }

  const handleNodeClick = (node: ITreeNode) => {
    if (isDayPageId(node.id)) {
      navigate(`/${space}/everyday/${node.id}`)
    } else {
      navigate(`/${space}/${node.id}`)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {contextNodes.map((node) => (
        <Badge
          key={node.id}
          variant="secondary"
          className="flex items-center gap-2 px-2 py-1 max-w-[200px]"
        >
          <div
            className="flex items-center gap-1 min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleNodeClick(node)}
            title={`Go to ${node.name || "Untitled"}`}
          >
            <NodeName node={node} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onRemoveNode(node.id)
            }}
            className="h-4 w-4 p-0 hover:bg-transparent hover:text-muted-foreground/70"
          >
            <XIcon size={12} />
          </Button>
        </Badge>
      ))}
    </div>
  )
}
