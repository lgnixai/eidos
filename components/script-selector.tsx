import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAllScripts } from "@/apps/web-app/[database]/scripts/hooks/use-all-scripts"

export const ScriptSelector = ({
  onSelect,
  value,
}: {
  onSelect?: (scriptId: string) => void
  value?: string
}) => {
  const scripts = useAllScripts()

  return (
    <Select onValueChange={onSelect} value={value}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="选择脚本..." />
      </SelectTrigger>
      <SelectContent>
        {scripts.map((script) => (
          <SelectItem key={script.id} value={script.id}>
            {script.name || "未命名"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
