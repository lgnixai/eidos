import { useTranslation } from "react-i18next"

import { TreeNodeType } from "@/packages/core/types/ITreeNode"
import { useAllNodes } from "@/apps/web-app/hooks/use-nodes"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const TableSelector = ({
  onSelect,
  value,
}: {
  onSelect?: (tableId: string) => void
  value?: string
}) => {
  const tables = useAllNodes({ type: TreeNodeType.Table })
  const { t } = useTranslation()

  const selectedValue = value || undefined

  return (
    <Select onValueChange={onSelect} value={selectedValue}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={t("common.table.selectPlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        {tables.map((table) => (
          <SelectItem key={table.id} value={table.id}>
            {table.name || t("common.table.untitled")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
