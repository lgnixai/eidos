import { DownloadIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ITreeNode } from "@/lib/store/ITreeNode"
import { downloadFile } from "@/lib/web/file"
import { useSqlite } from "@/hooks/use-sqlite"
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu"
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"

export const NodeExportContextMenu = ({ node }: { node: ITreeNode }) => {
  const { sqlite } = useSqlite()
  const { t } = useTranslation()

  const exportDoc = async (docId: string) => {
    const file = await sqlite?.exportMarkdown(docId)
    file &&
      downloadFile(
        new Blob([file], { type: "text/markdown" }),
        `${node.name || "Untitled"}.md`
      )
  }

  const exportTable = async (tableId: string) => {
    const file = await sqlite?.exportCsv(tableId)
    file &&
      downloadFile(
        new Blob([file], { type: "text/csv" }),
        `${node.name || "Untitled"}.csv`
      )
  }
  if (node.type === "table") {
    return (
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <DownloadIcon className="pr-2" />
          {t("common.export")}
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-48">
          <ContextMenuItem
            onClick={() => {
              exportTable(node.id)
            }}
          >
            Csv(.csv)
          </ContextMenuItem>
          <ContextMenuItem disabled>Excel(.xlsx)</ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
    )
  }
  if (node.type === "doc") {
    return (
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <DownloadIcon className="pr-2" />
          {t("common.export")}
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => {
                exportDoc(node.id)
              }}
            >
              Markdown(.md)
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuSubContent>
      </ContextMenuSub>
    )
  }
  return null
}

export const NodeExport = ({ node }: { node: ITreeNode }) => {
  const { sqlite } = useSqlite()
  const { t } = useTranslation()

  const exportDoc = async (docId: string) => {
    const md = await sqlite?.exportMarkdown(docId)
    md &&
      downloadFile(
        new Blob([md], { type: "text/markdown" }),
        `${node.name || "Untitled"}.md`
      )
  }

  const exportTable = async (tableId: string) => {
    const file = await sqlite?.exportCsv(tableId)
    file &&
      downloadFile(
        new Blob([file], { type: "text/csv" }),
        `${node.name || "Untitled"}.csv`
      )
  }

  if (node.type === "table") {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <DownloadIcon className="mr-2 h-4 w-4" />
          {t("common.export")}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-48">
          <DropdownMenuItem
            onClick={() => {
              exportTable(node.id)
            }}
          >
            Csv(.csv)
          </DropdownMenuItem>
          <DropdownMenuItem disabled>Excel(.xlsx)</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    )
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <DownloadIcon className="mr-2 h-4 w-4" />
        {t("common.export")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-48">
        <DropdownMenuItem
          onClick={() => {
            exportDoc(node.id)
          }}
        >
          Markdown(.md)
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
