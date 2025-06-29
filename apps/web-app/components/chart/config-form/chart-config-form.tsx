import { useEffect, useState } from "react"
import { Settings2 } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { type ChartConfig } from ".."
import { ChartBasicSettings } from "./chart-basic-settings"
import { ChartDisplayOptions } from "./chart-display-options"
import { ChartPreview } from "./chart-preview"
import { ChartSeriesConfig } from "./chart-series-config"
import type { DataSourceConfig, DataTransform } from "./types"

interface ChartConfigFormProps {
  config: ChartConfig
  onConfigChange: (config: ChartConfig) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  dataSource: DataSourceConfig
  transforms: DataTransform[]
  onDataSourceChange: (dataSource: DataSourceConfig) => void
  onTransformsChange: (transforms: DataTransform[]) => void
}

export function ChartConfigForm({
  config,
  onConfigChange,
  open,
  onOpenChange,
  dataSource,
  transforms,
  onDataSourceChange,
  onTransformsChange,
}: ChartConfigFormProps) {
  const [previewConfig, setPreviewConfig] = useState<ChartConfig>(config)
  const [isDirty, setIsDirty] = useState(false)

  const form = useForm<ChartConfig>({
    defaultValues: config,
  })

  useEffect(() => {
    setPreviewConfig(config)
  }, [config])

  useEffect(() => {
    const subscription = form.watch((value) => {
      const formValues = form.getValues()
      setPreviewConfig(formValues as ChartConfig)
      setIsDirty(JSON.stringify(formValues) !== JSON.stringify(config))
    })
    return () => subscription.unsubscribe()
  }, [form, config])

  const onSubmit = (values: Partial<ChartConfig>) => {
    onConfigChange({
      ...config,
      ...values,
    })
    setIsDirty(false)
    // onOpenChange(false)
  }

  const handleReset = () => {
    form.reset(config)
    setPreviewConfig(config)
    setIsDirty(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="xs">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[90vw] max-w-[80vw] h-[90vh] overflow-hidden p-2">
        {/* <DialogHeader className="px-6 py-2"></DialogHeader> */}

        <ResizablePanelGroup
          direction="horizontal"
          className="h-[calc(100%-73px)]"
        >
          <ResizablePanel defaultSize={70} minSize={40}>
            <div className="h-full overflow-auto p-2">
              <ChartPreview
                config={previewConfig}
                onDataChange={(data) => {
                  form.setValue("data", data)
                }}
                dataSource={dataSource}
                onDataSourceChange={(source) => {
                  onDataSourceChange(source)
                }}
                transforms={transforms}
                onTransformsChange={(newTransforms) => {
                  onTransformsChange(newTransforms)
                }}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={30} maxSize={50}>
            <div className="h-full overflow-y-auto">
              <div className="py-2 px-4">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-3"
                  >
                    <ChartBasicSettings
                      control={form.control}
                      data={form.getValues().data}
                    >
                      <div
                        className="flex gap-2 transition-opacity duration-200"
                        style={{
                          opacity: isDirty ? 1 : 0,
                          pointerEvents: isDirty ? "auto" : "none",
                        }}
                      >
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleReset}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          onClick={form.handleSubmit(onSubmit)}
                        >
                          Apply Changes
                        </Button>
                      </div>
                    </ChartBasicSettings>
                    <ChartSeriesConfig
                      control={form.control}
                      watch={form.watch}
                      setValue={form.setValue}
                      getValues={form.getValues}
                    />
                    <ChartDisplayOptions control={form.control} />
                  </form>
                </Form>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </DialogContent>
    </Dialog>
  )
}
