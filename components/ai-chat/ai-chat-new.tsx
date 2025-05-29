import { IEmbedding } from "@/worker/web-worker/meta-table/embedding"
import { useChat } from "ai/react"
import {
  Paintbrush,
  PaperclipIcon,
  PauseIcon,
  RefreshCcwIcon,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useWindowSize } from "usehooks-ts"

import { useAIConfigStore } from "@/apps/web-app/settings/ai/store"
import { useExperimentConfigStore } from "@/apps/web-app/settings/experiment/store"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useAiConfig } from "@/hooks/use-ai-config"
import { useAIFunctions } from "@/hooks/use-ai-functions"
import { ITreeNode } from "@/lib/store/ITreeNode"
import { useAppStore } from "@/lib/store/app-store"

import { useTranslation } from "react-i18next"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import { AIContextNodes } from "./ai-context-nodes"
import { AIInputEditor } from "./ai-input-editor"
import {
  sysPrompts,
  useAIChatStore,
  useSystemPrompt,
  useUserPrompts,
} from "./hooks"
import "./index.css"

import { UIBlock } from "../remix-chat/components/block"
import {
  PreviewMessage,
  ThinkingMessage,
} from "../remix-chat/components/message"
import { useScrollToBottom } from "../remix-chat/components/use-scroll-to-bottom"
import { AIChatAttachments } from "./ai-chat-attachments"
import { useAttachments } from "./hooks/use-attachments"
import { useAIChatSettingsStore } from "./settings/ai-chat-settings-store"
import { useSpeak } from "./webspeech/hooks"

const promptKeys = Object.keys(sysPrompts).slice(0, 1)

export default function Chat() {
  const { t } = useTranslation()

  const loadingRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const { prompts } = useUserPrompts()
  const { experiment } = useExperimentConfigStore()

  const [withSpaceData, setWithSpaceData] = useState(experiment.enableRAG)
  const [enableTools, setEnableTools] = useState(true) // 添加 enableTools 状态

  const { autoSpeak } = useAIChatSettingsStore()
  const divRef = useRef<HTMLDivElement>(null)
  const { currentSysPrompt, setCurrentSysPrompt } = useAIChatStore()
  const { aiConfig } = useAIConfigStore()
  // const { progress } = useLoadingStore()

  const { handleToolsCall, handleRunCode } = useAIFunctions()

  const [contextNodes, setContextNodes] = useState<ITreeNode[]>([])
  const [contextEmbeddings, setContextEmbeddings] = useState<IEmbedding[]>([])
  const { systemPrompt } = useSystemPrompt(
    currentSysPrompt,
    contextNodes,
    contextEmbeddings
  )

  // const { reload: reloadModel } = useReloadModel()
  const { aiModel, setAIModel } = useAppStore()
  const { speak } = useSpeak()

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

  const { getConfigByModel } = useAiConfig()
  const config = useMemo(() => {
    try {
      return getConfigByModel(aiModel)
    } catch (error) {
      return {}
    }
  }, [aiModel, getConfigByModel])

  const { messages, setMessages, reload, append, isLoading, stop } = useChat({
    onToolCall: async ({ toolCall }) => {
      const res = await handleToolsCall(toolCall.toolName, toolCall.args)
      console.log("toolCall", toolCall, res)
      return res
    },
    onFinish(message) {
      autoSpeak && speak(message.content, message.id)
      scrollToBottom()
    },
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
      useTools: enableTools, // 使用 enableTools 状态控制
    },
  })

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

  const handleManualRun = async (data: any) => {
    const res = await handleRunCode(data)
    append({
      id: crypto.randomUUID(),
      role: "user",
      content: JSON.stringify(res),
      hidden: true,
    } as any)
  }

  const setSpeechText = (text: string) => {
    append({
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    } as any)
  }

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>()

  const cleanMessages = useCallback(() => {
    setMessages([])
    setContextNodes([])
    setContextEmbeddings([])
    setAttachments([])
  }, [setMessages])

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

  const removeContextNode = (nodeId: string) => {
    setContextNodes((prev) => prev.filter((node) => node.id !== nodeId))
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
            chatId={"demo"}
            projectId={"demo"}
            message={message}
            block={block}
            setBlock={setBlock}
            isLoading={isLoading && messages.length - 1 === index}
            vote={undefined}
            onRegenerate={reload}
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
            <div className="flex min-w-[200px] items-center justify-end gap-2">
              <Label htmlFor="ai-chat-use-tools" className="text-sm opacity-80">
                {t("aiChat.inputEditor.useTools")}
              </Label>
              <Switch
                id="ai-chat-use-tools"
                checked={enableTools}
                onCheckedChange={setEnableTools}
              ></Switch>
            </div>
            <div className="flex w-full items-center justify-between gap-2">
              <AIContextNodes
                contextNodes={contextNodes}
                onRemoveNode={removeContextNode}
              />

              <div className="flex items-center gap-1"></div>
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
                <Button
                  variant="ghost"
                  onClick={() => reload()}
                  size="sm"
                  disabled={isLoading}
                >
                  <RefreshCcwIcon className="h-5 w-5" />
                </Button>
                <Button variant="ghost" onClick={cleanMessages} size="sm">
                  <Paintbrush className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div
          id="circle"
          className="absolute right-0 top-0 z-10 ml-0 h-1 rounded-sm bg-green-300 opacity-50"
        ></div>
        <AIInputEditor
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
          currentSysPrompt={currentSysPrompt}
          setCurrentSysPrompt={setCurrentSysPrompt}
          promptKeys={promptKeys}
          prompts={prompts}
          aiModel={aiModel}
          setAIModel={setAIModel}
          localModels={aiConfig.localModels}
        />
      </div>
    </div>
  )
}
