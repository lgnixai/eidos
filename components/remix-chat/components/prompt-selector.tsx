import { IExtension } from "@/packages/core/meta-table/extension"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PromptSelectorProps {
  prompts: IExtension[]
  selectedCustomPromptId: string | null
  onSelectedCustomPromptIdChange: (value: string | null) => void
  className?: string
}

export function PromptSelector({
  prompts,
  selectedCustomPromptId,
  onSelectedCustomPromptIdChange,
  className,
}: PromptSelectorProps) {
  return (
    <Select
      value={selectedCustomPromptId || "default"}
      onValueChange={(value) =>
        onSelectedCustomPromptIdChange(value === "default" ? null : value)
      }
    >
      <SelectTrigger
        className={`h-7 text-xs border-none bg-transparent shadow-none max-w-[150px] ${
          className || ""
        }`}
      >
        <SelectValue placeholder="Default Prompt" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">Default Prompt</SelectItem>
        {prompts.map((prompt) => (
          <SelectItem key={prompt.id} value={prompt.id}>
            {prompt.name || "Untitled Prompt"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
