import { CodeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { Callout } from "../eui/callout"

interface DataTransform {
  type: "filter" | "sort" | "aggregate"
  config: {
    filterColumn?: string
    filterValue?: string
    sortColumn?: string
    sortDirection?: "asc" | "desc"
    aggregateColumn?: string
    aggregateFunction?: "sum" | "avg" | "count"
    groupByColumn?: string
  }
}

interface DataTransformsProps {
  data: any[]
  transforms: DataTransform[]
  onTransformsChange: (transforms: DataTransform[]) => void
  onApplyTransforms: () => void
}

const getDataColumns = (data: Record<string, any>[]) => {
  if (!data.length) return []
  return Object.keys(data[0])
}

export function DataTransforms({
  data,
  transforms,
  onTransformsChange,
  onApplyTransforms,
}: DataTransformsProps) {
  return (
    <div className="p-3 space-y-3 border rounded-md">
      <Callout icon={<CodeIcon className="h-4 w-4" />}>
        Data transforms let you modify your data through operations like sorting
        and aggregation. Changes take effect as a one-time operation when you
        click the <span className="font-medium">Apply</span> button. Note:
        Aggregation will modify your data shape, but you can always adjust or
        reset the transforms.
      </Callout>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">Data Transforms</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onTransformsChange([
                  ...transforms,
                  {
                    type: "sort",
                    config: {},
                  },
                ])
              }
            >
              Add Transform
            </Button>
            <Button size="sm" onClick={onApplyTransforms}>
              Apply Transforms
            </Button>
          </div>
        </div>

        {transforms.map((transform, index) => (
          <div key={index} className="p-3 border rounded-md space-y-2">
            <div className="flex justify-between items-start gap-2">
              <Select
                value={transform.type}
                onValueChange={(value: DataTransform["type"]) => {
                  const newTransforms = [...transforms]
                  newTransforms[index] = { type: value, config: {} }
                  onTransformsChange(newTransforms)
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select transform type" />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="filter">Filter</SelectItem> */}
                  <SelectItem value="sort">Sort</SelectItem>
                  <SelectItem value="aggregate">Aggregate</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  const newTransforms = transforms.filter((_, i) => i !== index)
                  onTransformsChange(newTransforms)
                }}
              >
                Remove
              </Button>
            </div>

            {/* Filter transform UI */}
            {transform.type === "filter" && (
              <div className="grid gap-2">
                <Select
                  value={transform.config.filterColumn}
                  onValueChange={(value) => {
                    const newTransforms = [...transforms]
                    newTransforms[index].config.filterColumn = value
                    onTransformsChange(newTransforms)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column to filter" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDataColumns(data).map((column) => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Filter value"
                  value={transform.config.filterValue || ""}
                  onChange={(e) => {
                    const newTransforms = [...transforms]
                    newTransforms[index].config.filterValue = e.target.value
                    onTransformsChange(newTransforms)
                  }}
                  className="h-[60px] min-h-[60px]"
                />
              </div>
            )}

            {/* Sort transform UI */}
            {transform.type === "sort" && (
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={transform.config.sortColumn}
                  onValueChange={(value) => {
                    const newTransforms = [...transforms]
                    newTransforms[index].config.sortColumn = value
                    onTransformsChange(newTransforms)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column to sort" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDataColumns(data).map((column) => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={transform.config.sortDirection}
                  onValueChange={(value: "asc" | "desc") => {
                    const newTransforms = [...transforms]
                    newTransforms[index].config.sortDirection = value
                    onTransformsChange(newTransforms)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sort direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Aggregate transform UI */}
            {transform.type === "aggregate" && (
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={transform.config.groupByColumn}
                  onValueChange={(value) => {
                    const newTransforms = [...transforms]
                    newTransforms[index].config.groupByColumn = value
                    onTransformsChange(newTransforms)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group by column" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDataColumns(data).map((column) => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={transform.config.aggregateColumn}
                  onValueChange={(value) => {
                    const newTransforms = [...transforms]
                    newTransforms[index].config.aggregateColumn = value
                    onTransformsChange(newTransforms)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select aggregate column" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDataColumns(data).map((column) => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={transform.config.aggregateFunction}
                  onValueChange={(value: "sum" | "avg" | "count") => {
                    const newTransforms = [...transforms]
                    newTransforms[index].config.aggregateFunction = value
                    onTransformsChange(newTransforms)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select function" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="avg">Average</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
