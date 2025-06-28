import { useTranslation } from "react-i18next"

import { useAllViews } from "@/apps/web-app/hooks/use-all-views"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const ViewSelector = ({
  onSelect,
  value,
  tableId,
}: {
  onSelect?: (viewId: string) => void
  value?: string | null
  tableId: string
}) => {
  const views = useAllViews({ tableId })
  const { t } = useTranslation()

  const selectedValue = value || undefined

  return (
    <Select onValueChange={onSelect} value={selectedValue}>
      <SelectTrigger className="w-[200px]">
        <SelectValue
          placeholder={t("common.viewSelector.placeholder", "Select a view...")}
        />
      </SelectTrigger>
      <SelectContent>
        {views.map((view) => (
          <SelectItem key={view.id} value={view.id}>
            {view.name || t("common.viewSelector.untitled", "Untitled")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
