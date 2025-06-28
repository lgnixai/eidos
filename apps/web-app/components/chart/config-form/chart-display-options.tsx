import { Control } from "react-hook-form"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"

import { ChartConfig } from ".."

interface ChartDisplayOptionsProps {
  control: Control<ChartConfig>
}

export function ChartDisplayOptions({ control }: ChartDisplayOptionsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Display Options</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="showGrid"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>Show Grid</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="showTooltip"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>Show Tooltip</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="showLegend"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>Show Legend</FormLabel>
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
    </div>
  )
}
