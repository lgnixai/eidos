import { useCallback, useMemo, useRef, useState } from "react"
import { $convertFromMarkdownString, Transformer } from "@lexical/markdown"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useClickAway, useKeyPress } from "ahooks"
import { useChat } from "ai/react"
import {
  $createParagraphNode,
  $getRoot,
  $isTextNode,
  LexicalNode,
  RangeSelection,
} from "lexical"
import { PauseIcon, RefreshCcwIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { getCodeFromMarkdown } from "@/lib/markdown"
import { generateId, getBlockUrl, uuidv7 } from "@/lib/utils"
import { compileCode } from "@/lib/v3/compiler"
import builtInRemixPrompt from "@/lib/v3/prompts/built-in-remix-prompt.md?raw"
import { useAiConfig } from "@/hooks/use-ai-config"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { BlockRenderer } from "@/components/block-renderer/block-renderer"
import { Chart, ChartConfig } from "@/components/chart"
import { Loading } from "@/components/loading"
import { useAllMblocks } from "@/apps/web-app/[database]/scripts/hooks/use-all-mblocks"
import { useScript } from "@/apps/web-app/[database]/scripts/hooks/use-script"

import { $createChartNode } from "../../blocks/chart/node"
import { $createCustomBlockNode } from "../../blocks/custom/node"
import { useAllDocBlocks } from "../../hooks/use-all-doc-blocks"
import { useExtBlocks } from "../../hooks/use-ext-blocks"
import { $transformExtCodeBlock } from "../../utils/helper"
import { allTransformers } from "../const"
import { AIActionEnum, AIActionList } from "./ai-action-list"
import { AIContentEditor } from "./ai-msg-editor"
import { useGenerateChartConfig } from "./hooks/use-generate-chart"
import { useUpdateLocation } from "./hooks/use-update-location"
import { PromptList } from "./prompt-list"

export function AITools({
  cancelAIAction,
  content,
}: {
  cancelAIAction: (flag?: boolean) => void
  content: string
}) {
  const [editor] = useLexicalComposerContext()
  const selectionRef = useRef<RangeSelection | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [currentModel, setCurrentModel] = useState<string>("")
  const extBlocks = useExtBlocks()
  const allBlocks = useAllDocBlocks()
  const __allTransformers = useMemo(() => {
    return [...extBlocks.map((block) => block.transform), ...allTransformers]
  }, [extBlocks]) as Transformer[]

  const { reload: reloadBlocks } = useAllMblocks()
  const [generatedCode, setGeneratedCode] = useState<{
    ts_code: string
    code: string
  } | null>(null)

  const [isFinished, setIsFinished] = useState(true)
  const [promptListOpen, setPromptListOpen] = useState(true)
  const [actionOpen, setActionOpen] = useState(false)
  const [aiResult, setAiResult] = useState<string>("")
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null)
  const { getConfigByModel, codingModel } = useAiConfig()
  const { t } = useTranslation()
  const { generateConfig, isLoading: isChartLoading } = useGenerateChartConfig()

  const isMakeItRealRef = useRef(false)
  const isGenerateChartRef = useRef(false)
  const isMakeItReal = () => isMakeItRealRef.current

  const generateChartConfig = async () => {
    if (!codingModel) {
      toast({
        title: "No coding model available",
        description: "Please config a coding model",
      })
      return
    }
    setIsFinished(false)
    setPromptListOpen(false)
    isGenerateChartRef.current = true
    const config = await generateConfig(content, codingModel)
    setChartConfig(config)
    setActionOpen(true)
  }

  const resetState = () => {
    isMakeItRealRef.current = false
    isGenerateChartRef.current = false
    setIsFinished(true)
  }

  const { addScript } = useScript()
  const { messages, setMessages, reload, isLoading, stop } = useChat({
    onError(error) {
      console.log("error:", error)
      toast({
        title: error.message || t("common.error.tryAgainLater"),
        description: t("common.error.modelLimitation"),
      })
    },
    onFinish(message) {
      setAiResult(message.content)
      if (isMakeItReal()) {
        const codeBlocks = getCodeFromMarkdown(message.content)
        const indexJsxCode = codeBlocks.find(
          (code) => code.lang === "jsx" || code.lang === "typescript"
        )?.code
        if (indexJsxCode) {
          compileCode(indexJsxCode).then((res) => {
            if (!res.error) {
              setGeneratedCode({
                ts_code: indexJsxCode,
                code: res.code,
              })
            }
          })
        }
      }
      setActionOpen(true)
    },
    body: {
      ...getConfigByModel(currentModel),
      model: currentModel,
      useTools: false,
    },
  })

  const handleAction = useCallback(
    async (action: AIActionEnum) => {
      setActionOpen(false)

      const createParagraphNode = () => {
        const text = aiResult
        editor.focus()
        const paragraphNode = $createParagraphNode()
        $convertFromMarkdownString(text, __allTransformers, paragraphNode)
        return paragraphNode.getChildren()
      }
      const createChartNode = () => {
        const chartNode = $createChartNode(JSON.stringify(chartConfig))
        return chartNode
      }

      const prepareGeneratedNodes = async () => {
        if (isMakeItRealRef.current) {
          let scriptId = ""
          if (isMakeItRealRef.current && generatedCode) {
            scriptId = generateId()
            await addScript({
              id: scriptId,
              name: content,
              type: "m_block",
              description: content,
              version: "0.1.0",
              code: generatedCode.code,
              ts_code: generatedCode.ts_code,
              enabled: true,
              commands: [],
            })
            reloadBlocks()
          }
          return scriptId
        }
        return null
      }

      const getGeneratedNodes = (scriptId: string | null) => {
        if (isMakeItRealRef.current && scriptId) {
          return [$createCustomBlockNode(getBlockUrl(scriptId))]
        }
        if (isGenerateChartRef.current) {
          return [createChartNode()]
        }
        return createParagraphNode()
      }

      let scriptId: string | null = null

      const appendNodesAfterSelection = (generatedNodes: LexicalNode[]) => {
        const selection = selectionRef.current
        if (selection) {
          const newSelection = selection.clone()
          let node
          try {
            const selectNodes = newSelection.getNodes()
            node = selectNodes[selectNodes.length - 1]
          } catch (error) {}
          if (node) {
            try {
              const parent = node.getParent()
              if (parent) {
                let currentNode: LexicalNode = parent
                for (const node of generatedNodes) {
                  currentNode.insertAfter(node)
                  currentNode = node
                }
                currentNode.selectEnd()
              }
            } catch (error) {
              const root = $getRoot()
              root.append(...generatedNodes)
              generatedNodes[generatedNodes.length - 1].selectEnd()
            }
          } else {
            const root = $getRoot()
            root.append(...generatedNodes)
            generatedNodes[generatedNodes.length - 1].selectEnd()
          }
        } else {
          const root = $getRoot()
          root.append(...generatedNodes)
          generatedNodes[generatedNodes.length - 1].selectEnd()
        }
      }

      switch (action) {
        case AIActionEnum.INSERT_BELOW:
          scriptId = await prepareGeneratedNodes()
          editor.update(() => {
            const generatedNodes = getGeneratedNodes(scriptId)
            appendNodesAfterSelection(generatedNodes)
            $transformExtCodeBlock(allBlocks)
          })
          resetState()
          break
        case AIActionEnum.REPLACE:
          scriptId = await prepareGeneratedNodes()
          editor.update(() => {
            const selection = selectionRef.current
            const text = aiResult
            const generatedNodes = getGeneratedNodes(scriptId)
            if (selection) {
              const [start, end] = selection.getStartEndPoints() || []
              const isOneLine = start?.key === end?.key
              const isGeneratedNodesOnlyATextNode =
                generatedNodes.length === 1 && $isTextNode(generatedNodes[0])
              if (isOneLine && isGeneratedNodesOnlyATextNode) {
                selection.insertText(text)
                const textNode = generatedNodes[0]
                if ($isTextNode(textNode)) {
                  selection.setTextNodeRange(textNode, 0, textNode, text.length)
                }
              } else {
                if (isGenerateChartRef.current || isMakeItRealRef.current) {
                  appendNodesAfterSelection(generatedNodes)
                  selection.removeText()
                } else {
                  selection.insertText(text)
                  const lastNode = selection.getNodes()[selection.getNodes().length - 1]
                  if ($isTextNode(lastNode)) {
                    selection.setTextNodeRange(lastNode, 0, lastNode, text.length)
                  }
                }
              }
            } else {
              const root = $getRoot()
              root.append(...generatedNodes)
              generatedNodes[generatedNodes.length - 1].selectEnd()
            }
          })
          resetState()
          break
        case AIActionEnum.TRY_AGAIN:
          reload()
          return
      }
      cancelAIAction()
    },
    [
      __allTransformers,
      aiResult,
      cancelAIAction,
      editor,
      extBlocks,
      reload,
      isMakeItRealRef.current,
      isGenerateChartRef.current,
    ]
  )

  const handlePromptSelect = (
    prompt: string,
    model?: string,
    isCustomPrompt?: boolean
  ) => {
    if (!model) {
      toast({
        title: "No model available",
        description: "Please config a model",
      })
      return
    }

    setIsFinished(false)
    setCurrentModel(model)
    setTimeout(() => {
      if (isCustomPrompt) {
        setMessages([
          {
            id: uuidv7(),
            content: `You serve as an assistant, tasked with transforming user inputs, and the current directive is *${prompt}*，user's input will
be between <content-begin> and <content-end>. you just output the transformed content without any other information.`,
            role: "system",
          },
          {
            id: uuidv7(),
            content: `<content-begin>\n${content}\n<content-end>`,
            role: "user",
          },
        ])
      } else {
        setMessages([
          {
            id: uuidv7(),
            content: prompt,
            role: "system",
          },
          {
            id: uuidv7(),
            content: content,
            role: "user",
          },
        ])
      }

      reload()
      setPromptListOpen(false)
    }, 100)
  }

  const handleMakeItReal = () => {
    isMakeItRealRef.current = true
    handlePromptSelect(builtInRemixPrompt, codingModel)
  }

  useKeyPress("esc", () => {
    cancelAIAction(Boolean(isLoading || aiResult.length))
    isMakeItRealRef.current = false
    isGenerateChartRef.current = false
  })
  useClickAway(
    (e) => {
      if (
        document
          .querySelector("[role=ai-action-cancel-confirm]")
          ?.parentElement?.contains(e.target as Node)
      ) {
        return
      }
      cancelAIAction(Boolean(isLoading || aiResult.length))
      isMakeItRealRef.current = false
      isGenerateChartRef.current = false
    },
    boxRef,
    ["touchstart", "mousedown"]
  )
  const regenerate = () => {
    reload()
  }

  const { editorWidth } = useUpdateLocation(editor, selectionRef, boxRef)

  return (
    <div className=" fixed z-50" ref={boxRef}>
      {!isFinished && (
        <>
          <div
            className="rounded-md border bg-white p-2 shadow-md dark:border-gray-700 dark:bg-slate-800"
            style={{
              width: editorWidth,
            }}
          >
            {isGenerateChartRef.current && (
              <div>
                {isChartLoading ? (
                  <Loading />
                ) : chartConfig ? (
                  <Chart {...chartConfig} />
                ) : (
                  <span>No chart config</span>
                )}
              </div>
            )}
            {!isMakeItRealRef.current && (
              <AIContentEditor markdown={messages[2]?.content} />
            )}
            {isMakeItRealRef.current &&
              (isLoading ? (
                <Loading />
              ) : (
                generatedCode && (
                  <BlockRenderer
                    code={generatedCode?.ts_code}
                    compiledCode={generatedCode?.code}
                  />
                )
              ))}
            <div className="flex  w-full items-center justify-end opacity-50">
              {isLoading && (
                <Button onClick={stop} variant="ghost" size="sm">
                  <PauseIcon className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={regenerate}
                size="sm"
                disabled={isLoading}
              >
                <RefreshCcwIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
          {actionOpen && <AIActionList onSelect={handleAction} />}
        </>
      )}
      {promptListOpen && (
        <PromptList
          onPromptSelect={handlePromptSelect}
          onMakeItReal={handleMakeItReal}
          onGenerateChart={generateChartConfig}
        />
      )}
    </div>
  )
}
