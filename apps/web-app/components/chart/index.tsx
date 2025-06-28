import { ReactNode } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Funnel,
  FunnelChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Sankey,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import { PRESET_FILL_COLORS } from "./constants"

// Basic type definition
export type ChartType =
  | "line"
  | "bar"
  | "area"
  | "pie"
  | "scatter"
  | "radar"
  | "composed"
  | "treemap"
  | "radialBar"
  | "funnel"
  | "sankey"

// Common style configuration
interface StyleConfig {
  stroke?: string
  fill?: string
  strokeWidth?: number
  opacity?: number
}

// Axis configuration
interface AxisConfig {
  dataKey?: string
  label?: string
  type?: "number" | "category"
  domain?: [number | string, number | string]
  tickFormatter?: (value: any) => string
  style?: StyleConfig
}

// Series configuration
export interface SeriesConfig {
  type: "line" | "bar" | "area" | "scatter" | "radar" | "pie" | string
  dataKey: string
  name?: string
  style?: StyleConfig
  stack?: boolean
  smooth?: boolean
}

// Add new theme config interface
interface ThemeConfig {
  [key: string]: {
    label: string
    color: string
  }
}

interface ChartProps extends ChartConfig {
  hideControls?: boolean
}

export interface ChartConfig {
  type: ChartType
  data: any[]
  width?: number | string
  height?: number | string
  series: SeriesConfig[]
  xAxis?: AxisConfig
  yAxis?: AxisConfig
  showGrid?: boolean
  showTooltip?: boolean
  showLegend?: boolean
  style?: StyleConfig
  themeConfig?: ThemeConfig // New optional theme configuration
}

const ChartComponents: Record<ChartType, React.ComponentType<any>> = {
  line: LineChart,
  bar: BarChart,
  area: AreaChart,
  pie: PieChart,
  scatter: ScatterChart,
  radar: RadarChart,
  composed: ComposedChart,
  treemap: Treemap,
  radialBar: RadialBarChart,
  funnel: FunnelChart,
  sankey: Sankey as unknown as React.ComponentType<any>,
}

// Series component mapping
const SeriesComponents: Record<
  SeriesConfig["type"],
  React.ComponentType<any>
> = {
  line: Line,
  bar: Bar as unknown as React.ComponentType<any>,
  area: Area as unknown as React.ComponentType<any>,
  scatter: Scatter,
  radar: Radar as unknown as React.ComponentType<any>,
  pie: Pie as unknown as React.ComponentType<any>,
}

export function Chart(props: ChartConfig) {
  const {
    type,
    data,
    width = "100%",
    height = 400,
    series,
    xAxis,
    yAxis,
    showGrid = true,
    showTooltip = true,
    showLegend = true,
    style,
    themeConfig,
  } = props

  // Render chart series
  const renderSeries = (): ReactNode[] => {
    return series.map((seriesConfig, index) => {
      const seriesType = type === "composed" ? seriesConfig.type : type
      const SeriesComponent = SeriesComponents[seriesType]
      if (!SeriesComponent) return null

      const seriesStyle = {
        ...seriesConfig.style,
        ...(type === "radar" ? { opacity: 0.6 } : {}),
      }

      return (
        <SeriesComponent
          key={`${seriesType}-${index}`}
          dataKey={seriesConfig.dataKey}
          name={seriesConfig.name || seriesConfig.dataKey}
          stroke={seriesStyle.stroke}
          fill={seriesStyle.fill}
          strokeWidth={seriesStyle.strokeWidth}
          opacity={seriesStyle.opacity}
          type={seriesConfig.smooth ? "monotone" : "linear"}
          stackId={seriesConfig.stack ? "stack" : undefined}
        />
      )
    })
  }

  // Render chart content
  const renderChart = (): React.ReactElement => {
    const ChartComponent = ChartComponents[type]
    if (!ChartComponent) return <div>Chart type "{type}" not supported.</div>

    // Convert width/height to numbers for chart components
    const numericWidth = typeof width === "number" ? width : 500
    const numericHeight = typeof height === "number" ? height : 400

    // Special chart type handling
    if (type === "pie") {
      const nameKey = xAxis?.dataKey
      const valueKey = series?.[0]?.dataKey

      if (!series.length) {
        console.warn("Warning: Pie chart requires at least one series.")
        return <div>Pie chart requires at least one series.</div>
      }
      if (!nameKey) {
        console.warn(
          "Warning: Pie chart requires xAxis.dataKey for proper labeling. Current behavior uses array indices as names."
        )
        return <div>Pie chart requires xAxis.dataKey for proper labeling.</div>
      }

      return (
        <PieChart width={numericWidth} height={numericHeight}>
          <Pie
            data={data.map((item, index) => ({
              ...item,
              fill:
                themeConfig?.[item[nameKey]]?.color ||
                PRESET_FILL_COLORS[index % PRESET_FILL_COLORS.length],
            }))}
            dataKey={valueKey}
            nameKey={nameKey}
            {...style}
          />
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
        </PieChart>
      )
    }

    if (type === "radar") {
      return (
        <RadarChart width={numericWidth} height={numericHeight} data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey={xAxis?.dataKey} />
          <PolarRadiusAxis />
          {renderSeries()}
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
        </RadarChart>
      )
    }

    if (type === "treemap") {
      return (
        <Treemap
          width={numericWidth}
          height={numericHeight}
          data={data}
          dataKey={series[0].dataKey}
          nameKey={xAxis?.dataKey}
          {...style}
        >
          {showTooltip && <Tooltip />}
        </Treemap>
      )
    }

    if (type === "radialBar") {
      return (
        <RadialBarChart width={numericWidth} height={numericHeight} data={data}>
          <RadialBar dataKey={series[0].dataKey} {...style} />
          {showTooltip && <Tooltip />}
          {showLegend && <Legend />}
        </RadialBarChart>
      )
    }

    if (type === "funnel") {
      return (
        <FunnelChart width={numericWidth} height={numericHeight}>
          <Funnel dataKey={series[0].dataKey} data={data} {...style} />
          {showTooltip && <Tooltip />}
        </FunnelChart>
      )
    }

    // Standard Cartesian coordinate system chart
    return (
      <ChartComponent
        data={data}
        margin={{ top: 40, right: 20, bottom: 40, left: 40 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        {xAxis && (
          <XAxis
            dataKey={xAxis.dataKey}
            label={{
              value: xAxis.label,
              position: "bottom",
              style: { textAnchor: "middle" },
            }}
            type={xAxis.type}
            domain={xAxis.domain}
            tickFormatter={xAxis.tickFormatter}
            {...xAxis.style}
          />
        )}
        {yAxis && (
          <YAxis
            label={{
              value: yAxis.label,
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle" },
            }}
            type={yAxis.type}
            domain={yAxis.domain}
            tickFormatter={yAxis.tickFormatter}
            {...yAxis.style}
          />
        )}
        {showTooltip &&
          (themeConfig ? (
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          ) : (
            <Tooltip />
          ))}
        {showLegend && <Legend verticalAlign="top" height={36} />}
        {renderSeries()}
      </ChartComponent>
    )
  }

  return (
    <ChartContainer className="w-full h-full" config={themeConfig || {}}>
      {renderChart()}
    </ChartContainer>
  )
}
