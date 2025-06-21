import { formatDistanceToNow } from "date-fns"
import { History, MessageSquare, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCurrentNode } from "@/hooks/use-current-node"
import { cn } from "@/lib/utils"

import { useAIChatData } from "./hooks/use-ai-chat-data"
import { useContextNodes } from "./hooks/use-context-nodes"

export function AIChatHeader() {
  const { t } = useTranslation()

  const { chatId, chats, createNewChat, switchChat, deleteChat } =
    useAIChatData()

  const currentNode = useCurrentNode()
  const { addNode } = useContextNodes()

  const handleCreateNewChat = async () => {
    const newChatId = await createNewChat()
    if (currentNode) {
      addNode(currentNode)
    }
  }

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
          {chats.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {t("aiChat.noChats", "No chat history")}
            </div>
          ) : (
            chats.map(({ id, created_at }, index) => (
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
                      {getChatTitle(chats[index], index)}
                    </div>
                    {new Date(created_at + "Z").getTime() > 0 && (
                      <div className="text-xs text-muted-foreground truncate">
                        {formatDistanceToNow(new Date(created_at + "Z"), {
                          addSuffix: true,
                        })}
                      </div>
                    )}
                  </div>
                </div>
                {chats.length > 1 && (
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
        onClick={handleCreateNewChat}
        className="hover:bg-accent"
        title={t("aiChat.newChat", "New Chat")}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
