import { useCurrentChatProjectId } from "@/hooks/use-current-node"
import { createReactiveData } from "@/hooks/use-reactive-data"
import { useSqlite } from "@/hooks/use-sqlite"
import { uuidv7 } from "@/lib/utils"
import type { DataSpace } from "@/worker/web-worker/DataSpace"
import { Message } from "ai"
import { useEffect, useMemo } from "react"
import { z } from 'zod'
import { create } from "zustand"

// Define schemas for our data types
const messageSchema = z.object({
    id: z.string(),
    content: z.string(),
    role: z.enum(['user', 'assistant', 'system', 'data']),
    createdAt: z.date(),
    chat_id: z.string()
})

const chatSchema = z.object({
    id: z.string(),
    project_id: z.string(),
    title: z.string().optional(),
    created_at: z.string(),
})

type ChatMessage = z.infer<typeof messageSchema>
type Chat = z.infer<typeof chatSchema>

// Create reactive data stores for both chats and messages
const {
    useItemsList: useChatsListInternal,
    useReactiveOperations: useChatOperations,
    useSyncWithBroadcast: useSyncChatsInternal,
    useReload: useReloadChatsInternal,
} = createReactiveData<Chat>({
    modeName: 'chat',
    schema: chatSchema,
    list: async (sqlite: DataSpace, params?: Record<string, any>, options?: Record<string, any>) => {
        const chats = await sqlite.chat.list(params, options)
        return chats.map(chat => ({
            ...chat,
            created_at: chat.created_at + 'Z'
        }))
    }
})

const {
    useItemsList: useMessagesListInternal,
    useSyncWithBroadcast: useSyncMessagesInternal,
    useReload: useReloadMessagesInternal,
    useReactiveOperations: useMessageOperations,
} = createReactiveData<ChatMessage>({
    modeName: 'message',
    schema: messageSchema,
    list: async (sqlite: DataSpace, params?: Record<string, any>, options?: Record<string, any>) => {
        // Since we need to list all messages for the current project,
        // we'll filter them by chat_id later in the component
        const messages = await sqlite.message.list(params, options || {
            orderBy: "created_at",
            order: "ASC"
        })
        return messages.map(m => ({
            id: m.id,
            content: m.content,
            role: m.role as Message["role"],
            createdAt: new Date(m.created_at + 'Z'),
            chat_id: m.chat_id
        }))
    }
})



const useCurrentChatId = create<{
    currentChatId: string
    setCurrentChatId: (id: string) => void
}>((set) => ({
    currentChatId: "",
    setCurrentChatId: (id) => set({ currentChatId: id })
}))

export function useAIChatData() {
    const { sqlite } = useSqlite()
    const chatProjectId = useCurrentChatProjectId()

    // Set up sync for both chats and messages
    useSyncChatsInternal(sqlite)
    useSyncMessagesInternal(sqlite)

    // Get chat operations
    const chatOps = useChatOperations(sqlite)

    // Get all chats for the current project
    const { data: chats, loading: loadingChats } = useChatsListInternal(sqlite, {
        project_id: chatProjectId
    }, {
        orderBy: "created_at",
        order: "DESC"
    })

    const reloadChats = useReloadChatsInternal(sqlite)

    useEffect(() => {
        reloadChats({
            project_id: chatProjectId
        }, {
            orderBy: "created_at",
            order: "DESC"
        })
    }, [chatProjectId])


    const clearChatMessages = async (chatId: string) => {
        await sqlite?.message.clearMessages(chatId)
    }

    const createNewChat = async () => {
        const newChatId = uuidv7()
        setCurrentChatId(newChatId)
        await chatOps.insert({
            id: newChatId,
            project_id: chatProjectId,
            title: undefined
        })
        reloadChats({
            project_id: chatProjectId
        }, {
            orderBy: "created_at",
            order: "DESC"
        })
        return newChatId
    }

    const { currentChatId, setCurrentChatId } = useCurrentChatId()
    useEffect(() => {
        if (loadingChats) return
        if (chats.length > 0) {
            setCurrentChatId(chats[0].id)
        }
    }, [chats, loadingChats])

    const { data: messages, loading: loadingMessages } = useMessagesListInternal(sqlite, {
        chat_id: currentChatId
    }, {
        orderBy: "created_at",
        order: "ASC"
    })

    const reloadMessages = useReloadMessagesInternal(sqlite)

    useEffect(() => {
        reloadMessages({
            chat_id: currentChatId
        })
    }, [currentChatId])



    const switchChat = (id: string) => {
        setCurrentChatId(id)
    }

    const deleteChat = async (id: string) => {
        await chatOps.delete(id)
        setCurrentChatId(chats[0]?.id || "")
    }
    // Transform the data into the expected format
    const sortedChats = useMemo(() => {
        return chats.map(chat => ({
            id: chat.id,
            title: chat.title,
            messages: messages,
            createdAt: new Date(chat.created_at)
        }))
    }, [chats, messages])

    const deleteMessage = async (messageId: string) => {
        await sqlite?.message.del(messageId)
    }

    return {
        chatId: currentChatId,
        setCurrentChatId,
        chatMessages: messages,
        sortedChats,
        createNewChat,
        switchChat,
        deleteChat,
        loading: loadingChats,
        clearChatMessages,
        deleteMessage
    }
} 