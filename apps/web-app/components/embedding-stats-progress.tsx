import { AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmbeddingStatsProgressProps {
  className?: string
  stats?: {
    total: number
    vectorized: number
    outdated: number
    upToDate: number
    vectorizedPercentage: number
    outdatedPercentage: number
    upToDatePercentage: number
  }
}

export function EmbeddingStatsProgress({
  className,
  stats,
}: EmbeddingStatsProgressProps) {
  if (!stats?.total) return null

  const upToDatePercentage = (stats.upToDate / stats.total) * 100
  const outdatedPercentage = (stats.outdated / stats.total) * 100
  const remainingPercentage = 100 - upToDatePercentage - outdatedPercentage

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Embedding Stats</span>
        <span className="text-muted-foreground dark:text-gray-300">
          {stats.total.toLocaleString()} items total
        </span>
      </div>

      <div className="relative">
        <div className="h-6 w-full bg-[#E5E5E5] dark:bg-[#3A3A3C] flex">
          {/* Up to date - Light Green */}
          <div
            className="h-full bg-[#90EE90] dark:bg-[#98FB98]"
            style={{ width: `${upToDatePercentage}%` }}
          />
          {/* Outdated - Light Yellow */}
          <div
            className="h-full bg-[#F0E68C] dark:bg-[#FAFAD2]"
            style={{ width: `${outdatedPercentage}%` }}
          />
          {/* Not vectorized - Gray */}
          <div
            className="h-full bg-[#D3D3D3] dark:bg-[#A9A9A9]"
            style={{ width: `${remainingPercentage}%` }}
          />
        </div>

        {/* Remaining count on the right */}
        {/* <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-2 text-xs text-muted-foreground dark:text-gray-300">
          {(stats.total - stats.vectorized).toLocaleString()} not vectorized
        </div> */}
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-2    text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-[#90EE90] dark:bg-[#98FB98]" />
          <span className="dark:text-gray-100">Up to date</span>
          <span className="text-xs text-muted-foreground dark:text-gray-400">
            {stats.upToDate.toLocaleString()} items
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-[#F0E68C] dark:bg-[#FAFAD2]" />
          <span className="dark:text-gray-100">Outdated</span>
          <span className="text-xs text-muted-foreground dark:text-gray-400">
            {stats.outdated.toLocaleString()} items
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-[#D3D3D3] dark:bg-[#A9A9A9]" />
          <span className="dark:text-gray-100">Not vectorized</span>
          <span className="text-xs text-muted-foreground dark:text-gray-400">
            {(stats.total - stats.vectorized).toLocaleString()} items
          </span>
        </div>
      </div>

      {/* Warning for low up-to-date percentage */}
      {upToDatePercentage < 80 && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            A low percentage of up-to-date embeddings (
            {upToDatePercentage.toFixed(1)}%) may affect search result quality.
            Click process to update all embeddings.
          </span>
        </div>
      )}
    </div>
  )
}
