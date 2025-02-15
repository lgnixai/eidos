import { useCallback, useEffect, useRef, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import html2canvas from "html2canvas"
import { $getNodeByKey, NodeKey } from "lexical"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Chart, ChartConfig } from "@/components/chart"

import { $isChartNode } from "./node"

export interface ChartBlockProps {
  config: string // 
  nodeKey: NodeKey
}

export const ChartBlock: React.FC<ChartBlockProps> = ({ config, nodeKey }) => {
  const [chartConfigText, setChartConfigText] = useState<string>(config)
  const [mode, setMode] = useState<"preview" | "edit">("preview")
  const [parsedConfig, setParsedConfig] = useState<ChartConfig | null>(null)
  const [parseError, setParseError] = useState<string>("")
  const [editor] = useLexicalComposerContext()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const updateNodeConfig = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if (chartConfigText !== config && $isChartNode(node)) {
        node.setConfig(chartConfigText)
      }
    })
  }, [chartConfigText, config, nodeKey, editor])

  useEffect(() => {
    if (mode === "preview") {
      updateNodeConfig()
      try {
        const parsed = JSON.parse(chartConfigText) as ChartConfig
        setParsedConfig(parsed)
        setParseError("")
      } catch (error) {
        setParsedConfig(null)
        setParseError("Invalid JSON configuration")
      }
    }
  }, [mode, chartConfigText, updateNodeConfig])

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setChartConfigText(e.target.value)
    },
    []
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.stopPropagation()
      if (e.key === "Escape") {
        setMode("preview")
      }
    },
    []
  )

  const copyContent = useCallback(
    async (format: "png" | "svg" | "text") => {
      const chartRef = document.querySelector("#chart-renderer")
      if (chartRef) {
        try {
          if (format === "text") {
            await navigator.clipboard.writeText(chartConfigText)
          } else if (format === "svg") {
            const svgText = chartRef.innerHTML
            await navigator.clipboard.writeText(svgText)
          } else {
            const canvas = await html2canvas(chartRef as HTMLElement)
            canvas.toBlob((blob) => {
              if (blob) {
                const item = new ClipboardItem({ [`image/${format}`]: blob })
                navigator.clipboard.write([item])
              }
            }, `image/${format}`)
          }
          toast({
            title: `Copied as ${format}`,
            description: "Successfully copied the chart to the clipboard",
          })
        } catch (error) {
          console.error(`Failed to copy as ${format}:`, error)
          toast({
            title: `Failed to copy as ${format}`,
            description: "Failed to copy the chart to the clipboard",
          })
        }
      }
    },
    [chartConfigText, toast]
  )

  return (
    <div
      className="relative group bg-secondary"
      style={{ minHeight: "200px" }}
      ref={containerRef}
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
        <Button
          variant="outline"
          size="xs"
          onClick={(e) => {
            e.stopPropagation()
            setMode(mode === "preview" ? "edit" : "preview")
          }}
          className="cursor-pointer"
        >
          {mode === "preview" ? "Edit" : "Preview"}
        </Button>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="xs">
              Copy as <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent container={containerRef.current!}>
            <DropdownMenuItem onClick={() => copyContent("text")}>
              Text
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyContent("png")}>
              PNG
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {mode === "edit" && (
        <Textarea
          ref={textareaRef}
          value={chartConfigText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={chartConfigText.split("\n").length || 3}
          placeholder="Enter your chart configuration as JSON here..."
        />
      )}
      <div id="chart-renderer" className="group-hover:pointer-events-auto pointer-events-none p-2">
        {mode === "preview" && parseError && (
          <div className="text-red-500">{parseError}</div>
        )}
        {mode === "preview" && parsedConfig && (
          <div>
            <Chart {...parsedConfig} />
          </div>
        )}
      </div>
    </div>
  )
}
