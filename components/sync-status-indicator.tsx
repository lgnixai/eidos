"use client"

import React from "react"
import { AlertCircle, CheckCircle, CloudOff, Database } from "lucide-react"

import type { GraftStatus } from "@/packages/sync/graft/helpers"
import { SpaceInfo } from "@/hooks/use-space"
import { useSpaceSyncStatus } from "@/hooks/use-sync-status"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"

// Assuming tooltip component exists

export function SyncStatusIndicator() {
  const { status, error, spaceInfo } = useSpaceSyncStatus() as {
    status: GraftStatus | null
    error: Error | null
    spaceInfo: SpaceInfo | null
  }

  let content: React.ReactNode
  let tooltipText: string = "Sync Status" // Default tooltip
  let tooltipDetails: React.ReactNode = null // For additional details
  if (!spaceInfo?.isSyncEnabled) {
    return null
  }
  if (error) {
    content = (
      <div className="flex items-center space-x-1 text-sm text-red-500">
        <AlertCircle className="h-4 w-4" />
        <span>Error</span>
      </div>
    )
    tooltipText = `Sync error: ${error.message}`
  } else if (status) {
    const { volumeStatus, currentSnapshot, autosync } = status

    if (volumeStatus !== "Ok") {
      content = (
        <div className="flex items-center space-x-1 text-sm text-orange-500">
          <AlertCircle className="h-4 w-4" />
          <span>Volume Issue</span>
        </div>
      )
      tooltipText = `Volume Status: ${volumeStatus}`
    } else if (currentSnapshot) {
      const isSynced = true // Placeholder: Determine actual sync status logic here

      if (isSynced) {
        content = (
          <div className="flex items-center space-x-1 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Synced</span>
          </div>
        )
        tooltipText = `Data is up to date. Autosync: ${autosync ? "On" : "Off"}`
      } else {
        content = (
          <div className="flex items-center space-x-1 text-sm text-blue-500">
            <Database className="h-4 w-4" />
            <span>Ready</span>
          </div>
        )
        tooltipText = `Volume OK. Autosync: ${autosync ? "On" : "Off"}`
      }
      tooltipDetails = (
        <pre className="mt-1 pt-1 border-t border-border text-xs max-w-xs overflow-auto">
          {`Snapshot: LSN ${currentSnapshot.latestLsn} (${currentSnapshot.pageCount} pages)
Marker: ${currentSnapshot.primaryLsn}${currentSnapshot.marker}${currentSnapshot.secondaryLsn}
Client: ${status.clientId}
Volume: ${status.volumeId}`}
        </pre>
      )
    } else {
      content = (
        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
          <CloudOff className="h-4 w-4" />
          <span>No Snapshot</span>
        </div>
      )
      tooltipText = `Volume OK, but snapshot data is unavailable. Raw: ${status.currentSnapshotRaw}`
    }
  } else {
    content = (
      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
        <CheckCircle className="h-4 w-4" />
        <span>Idle</span>
      </div>
    )
    tooltipText = "Sync status is idle or unavailable."
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-default">{content}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
          {tooltipDetails}
          {/* Optionally display raw status for debugging */}
          {/* {status && <pre className="mt-1 pt-1 border-t border-border text-xs max-w-xs overflow-auto">{JSON.stringify(status, null, 2)}</pre>} */}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
