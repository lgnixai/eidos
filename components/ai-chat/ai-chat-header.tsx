import { Message } from "ai"
import { formatDistanceToNow } from "date-fns"
import { History, MessageSquare, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useAIChatData } from "./hooks/use-ai-chat-history"

export function AIChatHeader() {
  const { t } = useTranslation()

  const { chatId, sortedChats, createNewChat, switchChat, deleteChat } =
    useAIChatData()

  const getChatTitle = (
    chat: { id: string; title?: string },
    index: number
  ) => {
    return chat.title || `Untitled Chat`
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="xs" className="hover:bg-accent">
            <History className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[300px] max-h-[400px] overflow-y-auto"
        >
          {sortedChats.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {t("aiChat.noChats", "No chat history")}
            </div>
          ) : (
            sortedChats.map(({ id, createdAt }, index) => (
              <DropdownMenuItem
                key={id}
                className={cn(
                  "flex items-center justify-between group pr-1",
                  chatId === id && "bg-accent"
                )}
              >
                <div
                  className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                  onClick={() => switchChat(id)}
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">
                      {getChatTitle(sortedChats[index], index)}
                    </div>
                    {createdAt.getTime() > 0 && (
                      <div className="text-xs text-muted-foreground truncate">
                        {formatDistanceToNow(createdAt, {
                          addSuffix: true,
                        })}
                      </div>
                    )}
                  </div>
                </div>
                {sortedChats.length > 1 && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-6 w-6 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteChat(id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="xs"
        onClick={createNewChat}
        className="hover:bg-accent"
        title={t("aiChat.newChat", "New Chat")}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
