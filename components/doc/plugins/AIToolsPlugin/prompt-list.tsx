import { useRef, useState } from "react"
import * as Icons from "lucide-react"
import { ChevronRightIcon, LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useAiConfig } from "@/hooks/use-ai-config"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"

import { useBuiltInPrompts } from "./hooks/use-builtIn-prompts"
import { useAllPrompts } from "@/hooks/use-all-prompts"

interface PromptListProps {
  onPromptSelect: (prompt: string, model?: string, isCustom?: boolean) => void
  onMakeItReal: () => void
  onGenerateChart: () => void
}

export function PromptList({
  onPromptSelect,
  onMakeItReal,
  onGenerateChart,
}: PromptListProps) {
  const { findFirstAvailableModel, findAvailableModel } = useAiConfig()
  const { prompts } = useAllPrompts()
  const builtInPrompts = useBuiltInPrompts()
  const { t } = useTranslation()
  const [customPrompt, setCustomPrompt] = useState<string>("")
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const commandGroupRef = useRef<HTMLDivElement>(null)

  const runCustomAction = (prompt: string) => {
    const model = findFirstAvailableModel()
    if (!model) {
      toast({
        title: "No model available",
        description: "Please config a model",
      })
      return
    }
    onPromptSelect(prompt, model, true)
  }

  return (
    <Command className="w-[300px] rounded-lg border shadow-md">
      <CommandInput
        placeholder="Search prompt or enter custom ..."
        autoFocus
        value={customPrompt}
        onValueChange={(value) => {
          setCustomPrompt(value)
        }}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            const shouldRunCustomAction = !prompts.find((prompt) =>
              prompt.name.includes(customPrompt)
            )
            if (shouldRunCustomAction && customPrompt.length) {
              runCustomAction(customPrompt)
            }
          }
        }}
      />
      <ScrollArea>
        <CommandList className="max-h-[20rem]">
          <CommandEmpty>No Prompt found.</CommandEmpty>
          <CommandGroup heading="Built-in Prompts" ref={commandGroupRef}>
            <CommandItem
              className="flex items-center justify-between"
              onSelect={onMakeItReal}
            >
              <div className="flex items-center gap-2">
                <Icons.WandIcon className="h-5 w-5 opacity-50" />
                <span>Make it real</span>
              </div>
            </CommandItem>
            <CommandItem
              className="flex items-center justify-between"
              onSelect={onGenerateChart}
            >
              <div className="flex items-center gap-2">
                <Icons.BarChart2Icon className="h-5 w-5 opacity-50" />
                <span>Visualize Data</span>
              </div>
            </CommandItem>
            {builtInPrompts.map((prompt) => {
              const Icon = Icons[
                prompt.icon as keyof typeof Icons
              ] as LucideIcon
              if (prompt.parameters) {
                const { name, key, value } = prompt.parameters[0]
                return (
                  <DropdownMenu
                    key={prompt.name}
                    open={openDropdownId === prompt.name}
                    onOpenChange={(open) => {
                      setOpenDropdownId(open ? prompt.name : null)
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <CommandItem
                        className="flex items-center justify-between"
                        onSelect={() => setOpenDropdownId(prompt.name)}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 opacity-50" />
                          <span>{prompt.name}</span>
                        </div>
                        <ChevronRightIcon className="h-5 w-5" />
                      </CommandItem>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      side="right"
                      container={commandGroupRef.current!}
                    >
                      <DropdownMenuLabel>{name}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {value.map((item) => (
                        <DropdownMenuItem
                          key={item}
                          onClick={(e) => {
                            e.preventDefault()
                            const renderedPrompt = prompt.content.replace(
                              `{{${key}}}`,
                              item
                            )
                            onPromptSelect(
                              renderedPrompt,
                              findAvailableModel(prompt.type)
                            )
                          }}
                        >
                          {item}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }
              return (
                <CommandItem
                  key={prompt.name}
                  onSelect={() => {
                    onPromptSelect(prompt.content, findFirstAvailableModel())
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 opacity-50" />
                    <span>{prompt.name}</span>
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>
          <CommandGroup heading="Custom Prompts">
            {prompts.map((prompt) => (
              <CommandItem
                key={prompt.id}
                onSelect={() => {
                  onPromptSelect(prompt.code, prompt.model)
                }}
              >
                <span>{prompt.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </ScrollArea>
    </Command>
  )
}
