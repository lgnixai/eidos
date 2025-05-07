import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react"
import { IScript } from "@/worker/web-worker/meta-table/script"
import { useLocalStorageState, useMount, useSize } from "ahooks"
import { Code, Eye } from "lucide-react"
import { useTheme } from "next-themes"
import {
  useLoaderData,
  useRevalidator,
  useSearchParams,
} from "react-router-dom"

import { compileCode } from "@/lib/v3/compiler"
import { compileLexicalCode } from "@/lib/v3/lexical-compiler"
import { getCompileMethod } from "@/lib/v3/script-compiler"
import { Button } from "@/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useToast } from "@/components/ui/use-toast"
import { BlockRenderer } from "@/components/block-renderer/block-renderer"
import { DocEditorPlayground } from "@/components/doc-editor-playground"

import { ChatSidebar } from "./components/chat"
import { Header } from "./components/chat/header"
import { useChatHeader } from "./components/chat/use-chat-header"
import { ExtensionToolbar } from "./components/extension-toolbar"
import { ExtensionConfig } from "./config/config"
import { ScriptSandbox } from "./editor/script-sandbox"
import { getDescriptionFromCode, getEditorLanguage } from "./helper"
import { useExtensionChatHistory } from "./hooks/use-extension-chat-history"
import { useScript } from "./hooks/use-script"
import { useEditorStore } from "./stores/editor-store"

const CodeEditor = lazy(() => import("./editor/code-editor"))

const PreviewToggle = ({
  layoutMode,
  onLayoutModeChange,
}: {
  layoutMode: "preview" | "code"
  onLayoutModeChange: (mode: "preview" | "code") => void
}) => {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={layoutMode}
      onValueChange={(value) => {
        if (value) {
          onLayoutModeChange(value as "preview" | "code")
        }
      }}
      className="gap-1 bg-muted p-[3px] text-muted-foreground"
    >
      <ToggleGroupItem
        value="preview"
        className="flex items-center gap-1.5 px-2 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
      >
        <Eye className="h-3.5 w-3.5" />
        Preview
      </ToggleGroupItem>
      <ToggleGroupItem
        value="code"
        className="flex items-center gap-1.5 px-2 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
      >
        <Code className="h-3.5 w-3.5" />
        Code
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

export const ScriptDetailPage = () => {
  const script = useLoaderData() as IScript
  const { updateScript } = useScript()
  const editorRef = useRef<{ save: () => void; layout: () => void }>(null)
  const revalidator = useRevalidator()
  const language = getEditorLanguage(script)
  const [editorContent, setEditorContent] = useState(
    script.ts_code || script.code
  )
  const previewRef = useRef<HTMLDivElement>(null)
  const size = useSize(previewRef)

  const [extensionRightPanelSize, setExtensionRightPanelSize] =
    useLocalStorageState<number>("extension-right-panel-size", {
      defaultValue: 30,
    })

  const { layoutMode, setLayoutMode, scriptCodeMap, setScriptCodeMap } =
    useEditorStore()

  const currentDraftCode = scriptCodeMap["current"]

  const [currentCompiledDraftCode, setCurrentCompiledDraftCode] = useState(
    script.code
  )

  const isPreviewMode =
    layoutMode === "preview" &&
    (script.type === "doc_plugin" || script.type === "m_block")

  useEffect(() => {
    if (currentDraftCode) {
      const compileMethod =
        script.type === "doc_plugin" ? compileLexicalCode : compileCode
      compileMethod(currentDraftCode).then((result) => {
        setCurrentCompiledDraftCode(result.code)
      })
    } else {
      setCurrentCompiledDraftCode(script.code)
    }

    return () => {
      setScriptCodeMap("current", "")
    }
  }, [currentDraftCode, setLayoutMode])

  const showChat = script.type !== "prompt"
  // script.type !== "py_script"

  useEffect(() => {
    setCurrentCompiledDraftCode(script.code)
  }, [script.code])

  useEffect(() => {
    setEditorContent(script.ts_code || script.code)
  }, [script.ts_code, script.code])

  useMount(() => {
    revalidator.revalidate()
  })

  const { toast } = useToast()

  const onSubmit = useCallback(
    async (code: string, ts_code?: string, version?: string) => {
      if (
        code !== script.code ||
        ts_code !== script.ts_code ||
        (version && version !== script.version)
      ) {
        setEditorContent(ts_code || code)
        await updateScript({
          id: script.id,
          code,
          ts_code,
          version,
        })
        revalidator.revalidate()
        toast({
          title: "Code Updated Successfully",
          description: version
            ? `Version updated to ${version}`
            : "Content updated.",
        })
      }
      if (script.type === "script") {
        const sandbox = new ScriptSandbox()
        try {
          const exportsCommands = await sandbox.extractExports(code)
          if (exportsCommands) {
            await updateScript({
              id: script.id,
              commands: exportsCommands,
            })
          }
        } finally {
          sandbox.destroy()
        }
      }
      if (script.type === "udf") {
        const sandbox = new ScriptSandbox()
        try {
          const res = await sandbox.detectObjects(code)
          const func = Object.values(res)[0] as Function
          if (typeof func === "function") {
            const name = func.name
            const description = getDescriptionFromCode(code)
            await updateScript({
              id: script.id,
              name,
              description,
            })
          }
        } catch (error) {
          console.error("error", error)
        } finally {
          sandbox.destroy()
        }
      }
    },
    [revalidator, script, toast, updateScript]
  )
  const { theme } = useTheme()

  useEffect(() => {
    editorRef.current?.layout()
  }, [layoutMode])

  const compileAndSubmit = async () => {
    const ts_code = script.ts_code
    if (ts_code) {
      const compileMethod = getCompileMethod(script)
      if (!compileMethod) {
        return
      }
      const result = await compileMethod(ts_code)
      onSubmit(result, ts_code)
    }
  }

  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "basic"

  const { setChatId, chatTitles } = useEditorStore()
  const { chatId, chatHistoryMap, setChatHistoryMap, setChatHistory } =
    useExtensionChatHistory(script.id)

  const { chatIds, sortedChats, createNewChat, switchChat, deleteChat } =
    useChatHeader({
      scriptId: script.id,
      chatId,
      chatHistoryMap,
      setChatHistoryMap,
      setChatId,
      setChatHistory,
    })

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        setSearchParams({ tab: value })
      }}
      className="flex h-full w-full flex-col overflow-hidden p-2 px-4 pt-0"
    >
      <TabsList className="flex w-full border-b justify-between">
        <div className="flex items-center gap-2">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          {showChat && activeTab === "basic" && (
            <Header
              chatId={chatId}
              sortedChats={sortedChats}
              chatTitles={chatTitles}
              chatIds={chatIds}
              createNewChat={createNewChat}
              switchChat={switchChat}
              deleteChat={deleteChat}
            />
          )}
        </div>
        {activeTab === "basic" && (
          <div className="flex items-center gap-2">
            {(script.type === "m_block" || script.type === "doc_plugin") && (
              <PreviewToggle
                layoutMode={layoutMode}
                onLayoutModeChange={(newMode) => setLayoutMode(newMode)}
              />
            )}
            <ExtensionToolbar />
          </div>
        )}
      </TabsList>

      {revalidator.state === "loading" ? (
        <Skeleton className="mt-8 h-[20px] w-[100px] rounded-full" />
      ) : (
        <>
          <TabsContent
            value="basic"
            className="data-[state=inactive]:hidden h-full w-full flex flex-col grow min-h-0"
          >
            <div className="flex h-full flex-col gap-4">
              <div role="content" className="grow overflow-hidden min-h-0">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                  {showChat && (
                    <>
                      <ResizablePanel
                        defaultSize={extensionRightPanelSize}
                        minSize={20}
                        maxSize={50}
                        className="min-w-[400px]"
                        onResize={(size) => {
                          setExtensionRightPanelSize(size)
                        }}
                      >
                        <ChatSidebar
                          scriptId={script.id}
                          createNewChat={createNewChat}
                        />
                      </ResizablePanel>
                      <ResizableHandle />
                    </>
                  )}
                  <ResizablePanel
                    defaultSize={100 - (extensionRightPanelSize ?? 30)}
                  >
                    <div className="h-full">
                      {!isPreviewMode ? (
                        <Suspense
                          fallback={
                            <Skeleton className="h-[20px] w-[100px] rounded-full" />
                          }
                        >
                          <CodeEditor
                            ref={editorRef}
                            value={editorContent}
                            onSave={onSubmit}
                            language={language}
                            bindings={script.bindings}
                            scriptId={script.id}
                            theme={theme === "dark" ? "vs-dark" : "light"}
                            customCompile={getCompileMethod(script)}
                          />
                        </Suspense>
                      ) : (
                        <>
                          {!script.code ? (
                            <div className="flex h-full flex-col items-center justify-center gap-4">
                              <p className="text-muted-foreground">
                                No preview available. Build first to see the
                                preview.
                              </p>
                              <Button onClick={compileAndSubmit} size="sm">
                                Build
                              </Button>
                            </div>
                          ) : (
                            <div className="h-full p-2" ref={previewRef}>
                              {script.type === "doc_plugin" && (
                                <DocEditorPlayground
                                  code={currentCompiledDraftCode || script.code}
                                />
                              )}
                              {script.type === "m_block" && (
                                <BlockRenderer
                                  blockId={script.id}
                                  code={script.ts_code || ""}
                                  compiledCode={
                                    currentCompiledDraftCode ||
                                    script.code ||
                                    ""
                                  }
                                  env={script.env_map}
                                  bindings={script.bindings}
                                  height={size?.height}
                                />
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            </div>
          </TabsContent>
          <TabsContent
            value="settings"
            className="data-[state=inactive]:hidden h-full w-full overflow-y-auto"
          >
            <ExtensionConfig />
          </TabsContent>
        </>
      )}
    </Tabs>
  )
}
