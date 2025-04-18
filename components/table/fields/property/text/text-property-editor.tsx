import { useContext, useEffect, useState } from "react"
import { ChevronDown, ChevronRight, HelpCircle, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { IField } from "@/lib/store/interface"
import { getTableIdByRawTableName } from "@/lib/utils"
import { useAiConfig } from "@/hooks/use-ai-config"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { EmbeddingStatsProgress } from "@/components/embedding-stats-progress"
import { TableContext } from "@/components/table/hooks"

import { usePreview } from "./hooks"

export interface TextProperty {
  model?: string | null // Add other text-specific properties here if needed
  enableEmbedding?: boolean | null
  enableColorHint?: boolean | null // Add color hint option for vector status indication
}

interface IFieldPropertyEditorProps {
  uiColumn: IField<TextProperty>
  onPropertyChange: (property: TextProperty) => void
  isCreateNew?: boolean
}

export const TextPropertyEditor = (props: IFieldPropertyEditorProps) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [enableEmbedding, setEnableEmbedding] = useState(
    props.uiColumn.property?.enableEmbedding ?? false
  )
  const [enableColorHint, setEnableColorHint] = useState(
    props.uiColumn.property?.enableColorHint ?? false
  )
  const { viewId, tableName } = useContext(TableContext)
  const { process, getEmbeddingStats } = usePreview()
  const { embeddingModel } = useAiConfig()
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({
    processed: 0,
    total: 0,
    percentage: 0,
  })
  const updateProperty = (updates: Partial<TextProperty>) => {
    const currentProperty = props.uiColumn.property || {}
    const updatedProperty = {
      ...currentProperty,
      ...updates,
    }
    console.log("updatedProperty", updatedProperty)
    props.onPropertyChange(updatedProperty as TextProperty)
  }

  const [embeddingStats, setEmbeddingStats] = useState<{
    total: number
    vectorized: number
    outdated: number
    upToDate: number
    vectorizedPercentage: number
    outdatedPercentage: number
    upToDatePercentage: number
  }>()
  useEffect(() => {
    const fetchEmbeddingStats = async () => {
      if (props.uiColumn.property?.enableEmbedding) {
        const stats = await getEmbeddingStats(
          getTableIdByRawTableName(tableName),
          props.uiColumn.table_column_name
        )
        setEmbeddingStats(stats)
      }
    }
    fetchEmbeddingStats()
  }, [
    props.uiColumn.table_column_name,
    props.uiColumn.property?.enableEmbedding,
    // when progress is updated, we need to fetch the stats again
    progress,
  ])

  useEffect(() => {
    setEnableEmbedding(props.uiColumn.property?.enableEmbedding ?? false)
    setEnableColorHint(props.uiColumn.property?.enableColorHint ?? false)
  }, [
    props.uiColumn.property?.enableEmbedding,
    props.uiColumn.property?.enableColorHint,
  ])

  const handleEmbeddingToggle = (checked: boolean) => {
    if (!embeddingModel) {
      toast.error(t("table.propertyEditor.noEmbeddingModel"))
      return
    }
    setEnableEmbedding(checked)
    if (!props.uiColumn.property?.model) {
      updateProperty({ enableEmbedding: checked, model: embeddingModel })
    } else {
      updateProperty({ enableEmbedding: checked })
    }
  }

  const handleColorHintToggle = (checked: boolean) => {
    setEnableColorHint(checked)
    updateProperty({ enableColorHint: checked })
  }

  const handleProcess = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      await process(
        getTableIdByRawTableName(tableName),
        viewId!,
        props.uiColumn.table_column_name,
        (progress) => {
          console.log("progress", progress)
          setProgress(progress)
        }
      )
      toast.success(t("table.propertyEditor.processComplete"))
    } catch (error) {
      toast.error(t("table.propertyEditor.processError"))
    } finally {
      setIsProcessing(false)
      setProgress({ processed: 0, total: 0, percentage: 0 })
    }
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="gap-2 flex flex-col pt-2 border-t"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between ">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4" />
          <span>{t("table.propertyEditor.aiEnhancement")}</span>
        </div>
        {!open && <ChevronRight className="h-5 w-5" />}
        {open && <ChevronDown className="h-5 w-5" />}
      </CollapsibleTrigger>

      <CollapsibleContent className="flex flex-col gap-2 pb-0">
        {/* Embedding model information */}
        {embeddingModel && (
          <p className="text-sm text-muted-foreground">
            current embedding model:
            <Link to="/settings/ai#model-preferences" className="underline">
              {embeddingModel}
            </Link>{" "}
          </p>
        )}
        {/* Enable embedding toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Label className="text-sm" htmlFor="enable-embedding">
              {t("table.propertyEditor.enableEmbedding")}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  {t("table.propertyEditor.enableEmbeddingTip")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="enable-embedding"
            checked={enableEmbedding}
            onCheckedChange={handleEmbeddingToggle}
            aria-label={t("table.propertyEditor.enableEmbedding")}
          />
        </div>

        {/* Color Hint Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Label className="text-sm" htmlFor="enable-color-hint">
              {t("table.propertyEditor.enableColorHint")}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  {t("table.propertyEditor.enableColorHintTip")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="enable-color-hint"
            checked={enableColorHint}
            onCheckedChange={handleColorHintToggle}
            aria-label={t("table.propertyEditor.enableColorHint")}
          />
        </div>

        {/* Embedding Stats */}
        <EmbeddingStatsProgress stats={embeddingStats} />

        {/* Process Button with Progress Bar */}
        <div className="relative">
          <Button
            variant="outline"
            className="w-full relative"
            onClick={handleProcess}
            disabled={isProcessing}
          >
            <div
              className="absolute inset-0 bg-primary/10 origin-left transition-all duration-300"
              style={{
                width: `${progress.percentage}%`,
                opacity: isProcessing ? 1 : 0,
              }}
            />
            <span className="relative">
              {isProcessing
                ? `${t("table.propertyEditor.processing")} ${
                    progress.percentage
                  }%`
                : t("table.propertyEditor.process")}
            </span>
          </Button>
        </div>
        {/* <Input
          placeholder="Search"
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={handleQueryEmbedding}
        >
          {`query`}
        </Button> */}
      </CollapsibleContent>
    </Collapsible>
  )
}
