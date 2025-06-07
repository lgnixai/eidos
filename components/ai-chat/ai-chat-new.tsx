import { IEmbedding } from "@/packages/core/meta-table/embedding"
import { useChat } from "ai/react"
import { Paintbrush, PaperclipIcon, PauseIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useWindowSize } from "usehooks-ts"

import { useExperimentConfigStore } from "@/apps/web-app/settings/experiment/store"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useAiConfig } from "@/hooks/use-ai-config"
import { useAIFunctions } from "@/hooks/use-ai-functions"
import { useAllPrompts } from "@/hooks/use-all-prompts"
import { useAllTools } from "@/hooks/use-all-tools"
import { useCurrentExtension, useCurrentNode } from "@/hooks/use-current-node"
import { useCurrentPathInfo } from "@/hooks/use-current-pathinfo"
import { EIDOS_CHAT_PROJECT_ID } from "@/lib/const"
import { ITreeNode } from "@/lib/store/ITreeNode"
import { useAppStore } from "@/lib/store/app-store"

import { UIBlock } from "../remix-chat/components/block"
import {
  PreviewMessage,
  ThinkingMessage,
} from "../remix-chat/components/message"
import { useScrollToBottom } from "../remix-chat/components/use-scroll-to-bottom"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import { AIChatAttachments } from "./ai-chat-attachments"
import { AIModelSelect } from "./ai-chat-model-select"
import { AIChatPromptSelect } from "./ai-chat-prompt-select"
import { AIContextNodes } from "./ai-context-nodes"
import { AIInputEditor, AIInputEditorRef } from "./ai-input-editor"
import { useAIChatData } from "./hooks/use-ai-chat-history"
import { useAttachments } from "./hooks/use-attachments"
import { useSystemPrompt } from "./hooks/use-system-prompt"
import { useAIChatStore } from "./store"

export default function Chat() {
  const { t } = useTranslation()

  const loadingRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const aiInputEditorRef = useRef<AIInputEditorRef>(null)

  const currentNode = useCurrentNode()
  const { prompts } = useAllPrompts()
  const { experiment } = useExperimentConfigStore()

  const [withSpaceData, setWithSpaceData] = useState(experiment.enableRAG)
  const [enableTools, setEnableTools] = useState(true) // 添加 enableTools 状态

  const divRef = useRef<HTMLDivElement>(null)
  const { currentSysPrompt, setCurrentSysPrompt } = useAIChatStore()
  // const { progress } = useLoadingStore()

  const { handleToolsCall, handleRunCode } = useAIFunctions()

  const [contextNodes, setContextNodes] = useState<ITreeNode[]>([])
  const [contextEmbeddings, setContextEmbeddings] = useState<IEmbedding[]>([])
  const systemPrompt = useSystemPrompt(
    contextNodes
    // contextEmbeddings
  )

  const { chatId, chatMessages, clearChatMessages, deleteMessage } =
    useAIChatData()

  const { aiModel, setAIModel } = useAppStore()
  const { space } = useCurrentPathInfo()

  const disableInput = useMemo(
    () => !aiModel?.length || !systemPrompt?.length,
    [aiModel, systemPrompt]
  )

  useEffect(() => {
    const prompt = prompts.find((item) => item.id === currentSysPrompt)
    if (prompt) {
      const model = prompt.model ?? prompt.prompt_config?.model
      model && setAIModel(model)
    }
  }, [currentSysPrompt, prompts, setAIModel, systemPrompt])

  useEffect(() => {
    if (currentNode) {
      setContextNodes([currentNode])
    }
  }, [])

  const { getConfigByModel, textModelConfig } = useAiConfig()

  const config = useMemo(() => {
    try {
      return getConfigByModel(aiModel)
    } catch (error) {
      return {}
    }
  }, [aiModel, getConfigByModel])

  const tools = useAllTools()

  const { messages, setMessages, reload, append, isLoading, stop } = useChat({
    initialMessages: chatMessages,
    onToolCall: async (thisCall) => {
      const { toolCall } = thisCall
      console.log("thisCall", thisCall)
      console.log("toolCall", toolCall)
      const res = await handleToolsCall(toolCall.toolName, toolCall.args)
      console.log("toolCall", toolCall, res)
      return res
    },
    // onFinish(message) {},
    onError(error) {
      console.log("error:", error)
      toast({
        title: error.message || t("common.error.tryAgainLater"),
        description: t("common.error.modelLimitation"),
      })
    },
    body: {
      ...config,
      systemPrompt,
      model: aiModel,
      tools: tools,
      useTools: enableTools,
      id: chatId,
      projectId: EIDOS_CHAT_PROJECT_ID,
      space,
      textModel: textModelConfig,
    },
  })

  const handleReload = async () => {
    await reload()
  }

  useEffect(() => {
    setMessages(chatMessages)
  }, [chatMessages, setMessages])

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    if (isLoading && loadingRef.current) {
      loadingRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [isLoading])

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>()

  const cleanMessages = useCallback(async () => {
    clearChatMessages(chatId)
    setMessages([])
    setContextNodes([])
    setContextEmbeddings([])
    setAttachments([])
  }, [setMessages, chatId])

  const appendHiddenMessage = useCallback(
    (message: any) => {
      setMessages([
        ...messages,
        {
          ...message,
          hidden: true,
        },
      ])
    },
    [setMessages, messages]
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

  const {
    attachments,
    setAttachments,
    uploadQueue,
    fileInputRef,
    handleFileChange,
  } = useAttachments()
  const extension = useCurrentExtension()

  const removeContextNode = (nodeId: string) => {
    setContextNodes((prev) => prev.filter((node) => node.id !== nodeId))
    aiInputEditorRef.current?.deleteMentionNode(nodeId)
  }

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      ref={divRef}
    >
      <div
        ref={messagesContainerRef}
        className="flex min-w-0 flex-1 flex-col gap-6 overflow-auto px-2 pt-4"
      >
        {messages.map((message, index) => (
          <PreviewMessage
            key={message.id}
            chatId={chatId || ""}
            projectId={extension?.id || EIDOS_CHAT_PROJECT_ID}
            message={message}
            block={block}
            setBlock={setBlock}
            isLoading={isLoading && messages.length - 1 === index}
            vote={undefined}
            onRegenerate={handleReload}
            isLastMessage={index === messages.length - 1}
          />
        ))}

        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && <ThinkingMessage />}

        <div
          ref={messagesEndRef}
          className="h-32 w-6 shrink-0"
          aria-hidden="true"
        />
      </div>

      <input
        type="file"
        className="pointer-events-none fixed -left-4 -top-4 size-0.5 opacity-0"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      <div className="sticky bottom-0 bg-background p-4">
        <AIChatAttachments
          attachments={attachments}
          uploadQueue={uploadQueue}
        />

        <div className="flex items-center justify-between">
          {experiment.enableRAG && (
            <div className="flex min-w-[200px] gap-2">
              <Switch
                id="ai-chat-use-space-data"
                checked={withSpaceData}
                onCheckedChange={setWithSpaceData}
              ></Switch>
              <Label
                htmlFor="ai-chat-use-space-data"
                className="text-sm opacity-80"
              >
                {t("aiChat.inputEditor.talkToSpaceData")}
              </Label>
            </div>
          )}

          <div className="flex w-full flex-col">
            {/* <div className="flex min-w-[200px] items-center justify-end gap-2">
              <Label htmlFor="ai-chat-use-tools" className="text-sm opacity-80">
                {t("aiChat.inputEditor.useTools")}
              </Label>
              <Switch
                id="ai-chat-use-tools"
                checked={enableTools}
                onCheckedChange={setEnableTools}
              ></Switch>
            </div> */}
          </div>
        </div>
        <div
          id="circle"
          className="absolute right-0 top-0 z-10 ml-0 h-1 rounded-sm bg-green-300 opacity-50"
        ></div>

        <AIContextNodes
          contextNodes={contextNodes}
          onRemoveNode={removeContextNode}
        />
        <div className="flex flex-col mt-2">
          <AIInputEditor
            ref={aiInputEditorRef}
            enableRAG={withSpaceData}
            disabled={disableInput}
            setContextNodes={setContextNodes}
            setContextEmbeddings={setContextEmbeddings}
            append={append}
            appendHiddenMessage={appendHiddenMessage}
            isLoading={isLoading}
            attachments={attachments}
            setAttachments={setAttachments}
            uploadQueue={uploadQueue}
          />
          <div className="flex items-center gap-1  bg-card rounded-b-sm justify-between border border-t-0">
            <div className="flex items-center gap-1">
              <AIChatPromptSelect
                value={currentSysPrompt}
                onValueChange={setCurrentSysPrompt}
                promptKeys={["base"]}
                prompts={prompts}
              />
              <AIModelSelect
                onValueChange={setAIModel}
                value={aiModel}
                size="xs"
                className="max-w-[200px]  text-xs"
                localModels={[]}
                noBorder
              />
            </div>
            <div className="flex items-center gap-1">
              {isLoading && (
                <Button onClick={stop} variant="ghost" size="sm">
                  <PauseIcon className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <PaperclipIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" onClick={cleanMessages} size="sm">
                <Paintbrush className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
