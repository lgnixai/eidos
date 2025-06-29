import { Trash2 } from "lucide-react"
import type {
  Control,
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import type { ChartConfig, SeriesConfig } from ".."
import { PRESET_COLORS } from "../constants"

interface ChartSeriesConfigProps {
  control: Control<ChartConfig>
  watch: UseFormWatch<ChartConfig>
  setValue: UseFormSetValue<ChartConfig>
  getValues: UseFormGetValues<ChartConfig>
}

const getDataColumns = (data: Record<string, any>[]) => {
  if (!data.length) return []
  return Object.keys(data[0])
}

export function ChartSeriesConfig({
  control,
  watch,
  setValue,
  getValues,
}: ChartSeriesConfigProps) {
  const series = watch("series")
  const data = watch("data")
  const chartType = watch("type")

  const getNextColor = (currentIndex: number) => {
    const colorValues = Object.values(PRESET_COLORS)
    return colorValues[currentIndex % colorValues.length]
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Series Configuration</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const newSeries = [...getValues().series]
            const nextColor = getNextColor(newSeries.length)
            newSeries.unshift({
              type: "line",
              dataKey: "",
              name: "",
              style: nextColor,
            })
            setValue("series", newSeries)
          }}
        >
          Add Series
        </Button>
      </div>

      {series.map((_, index) => (
        <Card key={index} className="p-3">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm">Series {index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const newSeries = [...getValues().series]
                  newSeries.splice(index, 1)
                  setValue("series", newSeries)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={control}
                name={`series.${index}.type`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={(value: SeriesConfig["type"]) => {
                        field.onChange(value)
                        if (chartType !== "composed") {
                          const newSeries = [...getValues().series]
                          newSeries.forEach((s) => (s.type = value))
                          setValue("series", newSeries)
                        }
                      }}
                      defaultValue={field.value}
                      value={chartType === "composed" ? field.value : chartType}
                      disabled={chartType !== "composed"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {chartType === "composed" ? (
                          <>
                            <SelectItem value="line">Line</SelectItem>
                            <SelectItem value="bar">Bar</SelectItem>
                            <SelectItem value="area">Area</SelectItem>
                            <SelectItem value="scatter">Scatter</SelectItem>
                            {/* <SelectItem value="pie">Pie</SelectItem>
                            <SelectItem value="radar">Radar</SelectItem> */}
                          </>
                        ) : (
                          <SelectItem value={chartType}>{chartType}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`series.${index}.dataKey`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Key</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select data key" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {data.length > 0 &&
                          getDataColumns(data)
                            .filter((key) => {
                              const value = data[0][key]
                              return (
                                typeof value === "number" ||
                                !isNaN(Number(value))
                              )
                            })
                            .map((key) => (
                              <SelectItem key={key} value={key}>
                                {key}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`series.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter series name" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`series.${index}.stack`}
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Stack</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={control}
                name={`series.${index}.style.stroke`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stroke Color</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color">
                            <div className="flex items-center gap-2">
                              {field.value && (
                                <div
                                  className="w-4 h-4 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: field.value }}
                                />
                              )}
                              {field.value || "Select color"}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PRESET_COLORS).map(([name, color]) => (
                          <SelectItem key={color.stroke} value={color.stroke}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: color.stroke }}
                              />
                              {name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`series.${index}.style.fill`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fill Color</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color">
                            <div className="flex items-center gap-2">
                              {field.value && (
                                <div
                                  className="w-4 h-4 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: field.value }}
                                />
                              )}
                              {field.value || "Select color"}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PRESET_COLORS).map(([name, color]) => (
                          <SelectItem key={color.fill} value={color.fill}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: color.fill }}
                              />
                              {name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
