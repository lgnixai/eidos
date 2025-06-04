import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ITreeNode } from "@/lib/store/ITreeNode"
import { useAllExtNodes } from "@/hooks/use-all-ext-nodes"
import { useCurrentPathInfo } from "@/hooks/use-current-pathinfo"
import { useGoto } from "@/hooks/use-goto"
import { useSqlite } from "@/hooks/use-sqlite"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const CreateNodeTrigger = ({ parent_id }: { parent_id?: string }) => {
  const { space } = useCurrentPathInfo()
  const { t } = useTranslation()

  const { extNodes } = useAllExtNodes()

  const { createDoc, createTable, createFolder, createExtNode } =
    useSqlite(space)
  const goto = useGoto()

  const handleCreateDoc = async () => {
    const docId = await createDoc("", parent_id)
    goto(space, docId)
  }

  const handleCreateTable = async () => {
    const tableId = await createTable("", parent_id)
    goto(space, tableId)
  }

  const handlerCreateFolder = async () => {
    const folderId = await createFolder(parent_id)
    console.log("create folder")
  }

  const handleCreateExtNode = async (type: ITreeNode["type"]) => {
    const extNode = extNodes.find((node) => node.ext_node_type === type)
    if (!extNode) return
    console.log("creating ", extNode)
    const extNodeId = await createExtNode(extNode.ext_node_type, parent_id)
    if (!extNodeId) return
    goto(space, extNodeId)
  }

  const handleCreateNode = (type: ITreeNode["type"]) => {
    switch (type) {
      case "table":
        handleCreateTable()
        break
      case "doc":
        handleCreateDoc()
        break
      case "folder":
        handlerCreateFolder()
        break
      default:
        handleCreateExtNode(type)
        break
    }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="opacity-50" variant="ghost" size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => {
            handleCreateNode("doc")
          }}
        >
          {t("node.menu.newDoc")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            handleCreateNode("table")
          }}
        >
          {t("node.menu.newTable")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            handleCreateNode("folder")
          }}
        >
          {t("node.menu.newFolder")}
        </DropdownMenuItem>
        {extNodes.length > 0 && <DropdownMenuSeparator />}
        {extNodes.map((node) => (
          <DropdownMenuItem
            key={node.id}
            onClick={() => {
              handleCreateNode(node.ext_node_type)
            }}
          >
            {t("node.menu.newExtNode", { name: node.name })}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
