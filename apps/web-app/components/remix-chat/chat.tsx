"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Attachment, ChatRequestOptions, Message } from "ai"
import { useChat } from "ai/react"
import { AnimatePresence } from "framer-motion"
import { useSWRConfig } from "swr"
import { useWindowSize } from "usehooks-ts"

import docPluginPrompt from "@/packages/v3/prompts/built-in-remix-prompt-for-doc-plugin.md?raw"
import builtInRemixPromptForPrompt from "@/packages/v3/prompts/built-in-remix-prompt-for-prompt.md?raw"
import pythonScriptPrompt from "@/packages/v3/prompts/built-in-remix-prompt-for-python-script.md?raw"
import scriptPrompt from "@/packages/v3/prompts/built-in-remix-prompt-for-script.md?raw"
import builtInRemixPromptForUDF from "@/packages/v3/prompts/built-in-remix-prompt-for-udf.md?raw"
import builtInRemixPrompt from "@/packages/v3/prompts/built-in-remix-prompt.md?raw"
import { useAiConfig } from "@/apps/web-app/hooks/use-ai-config"
import { useAllPrompts } from "@/apps/web-app/hooks/use-all-prompts"
import { useCurrentPathInfo } from "@/apps/web-app/hooks/use-current-pathinfo"
import { useMblock } from "@/apps/web-app/hooks/use-mblock"
import { useToast } from "@/components/ui/use-toast"
import { useRemixPrompt } from "@/apps/web-app/pages/[database]/extensions/hooks/use-remix-prompt"
import { useEditorStore } from "@/apps/web-app/pages/[database]/extensions/stores/editor-store"
import { TaskType } from "@/apps/web-app/pages/settings/ai/hooks"

import { Block, type UIBlock } from "./components/block"
import { BlockStreamHandler } from "./components/block-stream-handler"
import { PreviewMessage, ThinkingMessage } from "./components/message"
import { MultimodalInput } from "./components/multimodal-input"
import { Overview } from "./components/overview"
import { useScrollToBottom } from "./components/use-scroll-to-bottom"
import type { Vote } from "./interface"

export function Chat({
  id,
  scriptId,
  initialMessages,
  selectedModelId,
}: {
  id: string
  scriptId: string
  initialMessages: Array<Message>
  selectedModelId: string
}) {
  const { mutate } = useSWRConfig()
  const {
    codingModel,
    getConfigByModel,
    findFirstAvailableModel,
    textModelConfig,
  } = useAiConfig()
  const script = useMblock(scriptId)
  const [remixPrompt, setRemixPrompt] = useState("")
  const { getRemixPrompt } = useRemixPrompt()
  const { prompts } = useAllPrompts()
  const [selectedCustomPromptId, setSelectedCustomPromptId] = useState<
    string | null
  >(null)
  const { setChatHistory } = useEditorStore()
  const { toast } = useToast()

  useEffect(() => {
    const getPromptByScriptType = (type?: string) => {
      switch (type) {
        case "script":
          return scriptPrompt
        case "doc_plugin":
          return docPluginPrompt
        case "py_script":
          return pythonScriptPrompt
        case "udf":
          return builtInRemixPromptForUDF
        case "prompt":
          return builtInRemixPromptForPrompt
        default:
          return builtInRemixPrompt
      }
    }

    // If a custom prompt is selected, use it instead of the default prompt
    const basePrompt = selectedCustomPromptId
      ? prompts.find((p) => p.id === selectedCustomPromptId)?.code ||
        getPromptByScriptType(script?.type)
      : getPromptByScriptType(script?.type)

    getRemixPrompt(
      script?.bindings,
      script?.ts_code || script?.code,
      basePrompt
    ).then(setRemixPrompt)
  }, [
    script?.bindings,
    script?.ts_code,
    script?.code,
    script?.type,
    selectedCustomPromptId,
    prompts,
    getRemixPrompt,
  ])
  const [aiModel, setAIModel] = useState(
    codingModel ?? findFirstAvailableModel()
  )

  const config = useMemo(() => {
    try {
      return getConfigByModel(aiModel)
    } catch (error) {
      return {}
    }
  }, [aiModel, getConfigByModel])

  const { space } = useCurrentPathInfo()
  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    data: streamingData,
    reload,
  } = useChat({
    body: {
      ...config,
      systemPrompt: remixPrompt,
      id,
      model: aiModel,
      space,
      projectId: scriptId,
      useTools: false,
      textModel: textModelConfig,
    },
    initialMessages,
    onFinish: () => {
      setMessages((currentMessages) => {
        console.log("messages:", currentMessages)
        setChatHistory(currentMessages)
        return currentMessages
      })
    },
    onError: (error) => {
      console.error("Chat error:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred during the chat",
        variant: "destructive",
      })
    },
    onResponse: (response) => {
      if (!response.ok) {
        console.error("Response not ok:", response.statusText)
      }
    },
  })

  const myHandleSubmit = useCallback(
    (
      event?: {
        preventDefault?: () => void
      },
      chatRequestOptions?: ChatRequestOptions
    ) => {
      handleSubmit(event, chatRequestOptions)
    },
    [handleSubmit]
  )

  const { width: windowWidth = 1920, height: windowHeight = 1080 } =
    useWindowSize()

  const [block, setBlock] = useState<UIBlock>({
    documentId: "init",
    content: "",
    title: "",
    status: "idle",
    isVisible: false,
    boundingBox: {
      top: windowHeight / 4,
      left: windowWidth / 4,
      width: 250,
      height: 50,
    },
  })

  // const { data: votes } = useSWR<Array<Vote>>(`/api/vote?chatId=${id}`, fetcher)
  const votes: Array<Vote> = []

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>()

  const [attachments, setAttachments] = useState<Array<Attachment>>([])

  const handleRegenerate = useCallback(async () => {
    await reload()
  }, [reload])

  return (
    <>
      <div className="flex flex-col min-w-0 h-full bg-background relative">
        <div
          ref={messagesContainerRef}
          className="flex flex-col min-w-0 gap-6 flex-1 pt-4 pb-[120px]"
        >
          {messages.length === 0 && <Overview aiModel={aiModel} />}

          {messages.map((message, index) => (
            <PreviewMessage
              key={message.id}
              chatId={id}
              projectId={scriptId}
              message={message}
              block={block}
              setBlock={setBlock}
              isLoading={isLoading && messages.length - 1 === index}
              vote={votes?.find((vote) => vote.messageId === message.id)}
              onRegenerate={handleRegenerate}
              isLastMessage={index === messages.length - 1}
            />
          ))}

          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === "user" && (
              <ThinkingMessage />
            )}

          <div
            ref={messagesEndRef}
            className="flex-shrink-0 h-32 w-6"
            aria-hidden="true"
          />
        </div>

        <form className="flex mx-auto px-4 pb-4 md:pb-6 gap-2 w-full md:max-w-3xl sticky bottom-0 inset-x-0 bg-background">
          <MultimodalInput
            chatId={id}
            type={script?.type ?? "script"}
            input={input}
            setInput={setInput}
            handleSubmit={myHandleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            setMessages={setMessages}
            append={append}
            aiModel={aiModel}
            setAIModel={setAIModel}
            prompts={prompts}
            selectedCustomPromptId={selectedCustomPromptId}
            setSelectedCustomPromptId={setSelectedCustomPromptId}
          />
        </form>
      </div>

      <AnimatePresence>
        {block?.isVisible && (
          <Block
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            append={append}
            block={block}
            setBlock={setBlock}
            messages={messages}
            setMessages={setMessages}
            votes={votes}
          />
        )}
      </AnimatePresence>

      <BlockStreamHandler streamingData={streamingData} setBlock={setBlock} />
    </>
  )
}

export default Chat
