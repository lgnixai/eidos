import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { DataTransforms } from "../../data-pipeline/data-transforms"
import { ScriptDataSource } from "./script-data-source"
import { TableDataSource } from "./table-data-source"
import {
  DataSourceConfig,
  DataSourceType,
  DataTransform
} from "./types"

interface DataSourceConfigProps {
  data: any[]
  onDataChange: (data: any[]) => void
  dataSource: DataSourceConfig
  onDataSourceChange: (source: DataSourceConfig) => void
  transforms: DataTransform[]
  onTransformsChange: (transforms: DataTransform[]) => void
}

export function DataSourceConfigComponent({
  data,
  onDataChange,
  dataSource,
  onDataSourceChange,
  transforms,
  onTransformsChange,
}: DataSourceConfigProps) {
  const handleDynamicSourceChange = (type: DataSourceType) => {
    switch (type) {
      case "raw":
        onDataSourceChange({ type: "raw" })
        break
      case "table":
        onDataSourceChange({ type: "table", tableId: "" })
        break
      case "script":
        onDataSourceChange({ type: "script", scriptId: "" })
        break
    }
  }

  const applyTransforms = (data: any[]) => {
    return transforms.reduce((result, transform) => {
      switch (transform.type) {
        case "filter":
          return result.filter((item) =>
            String(item[transform.config.filterColumn!]).includes(
              transform.config.filterValue!
            )
          )
        case "sort":
          return [...result].sort((a, b) => {
            const aVal = a[transform.config.sortColumn!]
            const bVal = b[transform.config.sortColumn!]
            return transform.config.sortDirection === "asc"
              ? aVal > bVal
                ? 1
                : -1
              : aVal < bVal
              ? 1
              : -1
          })
        case "aggregate":
          if (!transform.config.groupByColumn) return result
          const groups = result.reduce((acc, item) => {
            const key = item[transform.config.groupByColumn!]
            if (!acc[key]) acc[key] = []
            acc[key].push(item)
            return acc
          }, {} as Record<string, any[]>)

          return (Object.entries(groups) as [string, any[]][]).map(
            ([key, group]) => {
              const value =
                transform.config.aggregateFunction === "sum"
                  ? group.reduce(
                      (sum, item) =>
                        sum + Number(item[transform.config.aggregateColumn!]),
                      0
                    )
                  : transform.config.aggregateFunction === "avg"
                  ? group.reduce(
                      (sum: number, item: any) =>
                        sum + Number(item[transform.config.aggregateColumn!]),
                      0
                    ) / group.length
                  : group.length

              return {
                [transform.config.groupByColumn!]: key,
                [`${transform.config.aggregateFunction}_${transform.config.aggregateColumn}`]:
                  value,
              }
            }
          )
        default:
          return result
      }
    }, data)
  }

  const handleDataUpdate = (newData: any[]) => {
    const transformedData = applyTransforms(newData)
    onDataChange(transformedData)
  }

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      <div className="p-4 space-y-4 border rounded-md">
        <div className="space-y-2">
          <Label>Source Type</Label>
          <Select
            value={dataSource.type}
            onValueChange={handleDynamicSourceChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select data source type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="raw">Raw</SelectItem>
              <SelectItem value="table">Table</SelectItem>
              <SelectItem value="script">Script</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {dataSource.type === "raw" && (
            <>
              <Label>Raw Data</Label>
              <p>
                Raw Data will be used as the data source for the chart. you can
                use the <span className="font-bold">JSON editor</span> to edit
                the data.
              </p>
            </>
          )}

          {dataSource.type === "table" && (
            <TableDataSource
              config={dataSource}
              onConfigChange={onDataSourceChange}
              onDataChange={onDataChange}
            />
          )}

          {dataSource.type === "script" && (
            <ScriptDataSource
              config={dataSource}
              onConfigChange={onDataSourceChange}
              onDataChange={onDataChange}
            />
          )}
        </div>
      </div>

      <DataTransforms
        data={data}
        transforms={transforms}
        onTransformsChange={onTransformsChange}
        onApplyTransforms={() => handleDataUpdate(data)}
      />
    </div>
  )
}
