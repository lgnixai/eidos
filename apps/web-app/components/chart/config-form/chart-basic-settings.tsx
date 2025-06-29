import type { Control } from "react-hook-form"

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

import type { ChartConfig, ChartType } from ".."

const getDataColumns = (data: Record<string, any>[]) => {
  if (!data.length) return []
  return Object.keys(data[0])
}

interface ChartBasicSettingsProps {
  control: Control<ChartConfig>
  data: Record<string, any>[]
  children?: React.ReactNode
}

export function ChartBasicSettings({
  control,
  data,
  children,
}: ChartBasicSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Basic Settings</h3>
        {children}
      </div>

      <FormField
        control={control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Chart Type</FormLabel>
            <Select
              onValueChange={(value: ChartType) => field.onChange(value)}
              defaultValue={field.value}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {/* x-y chart */}
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="scatter">Scatter</SelectItem>
                <SelectItem value="composed">Composed</SelectItem>
                {/* pie chart */}
                <SelectItem value="pie">Pie</SelectItem>
                {/* radar chart */}
                <SelectItem value="radar">Radar</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {/* <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="width"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Width</FormLabel>
              <FormControl>
                <Input type="text" placeholder="100% or number" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="height"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Height</FormLabel>
              <FormControl>
                <Input type="text" placeholder="400" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div> */}

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="xAxis.dataKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>X Axis Data Key</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select X axis data key" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {data?.length > 0 &&
                    getDataColumns(data).map((key) => (
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
          name="xAxis.label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>X Axis Label</FormLabel>
              <FormControl>
                <Input type="text" placeholder="X Axis" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
