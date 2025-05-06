import { useCallback, useState } from "react"
import { IScript } from "@/worker/web-worker/meta-table/script"
import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

import { useExtensionMarketplace } from "../hooks/use-extension-marketplace"
import { useEditorStore } from "../stores/editor-store"

// We might need a hook similar to useExtensionSubmit for update logic later
// For now, we'll mock the update check.

interface CheckForUpdatesButtonProps {
  script: IScript
  editorContent: string // Added to compare with fetched code
  // onSuccess callback if an update is performed, similar to ShareExtensionButton
  // onUpdateAvailable?: (updateInfo: any) => void;
}

export const CheckForUpdatesButton = ({
  script,
  editorContent, // Added prop
}: CheckForUpdatesButtonProps) => {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [updateMessage, setUpdateMessage] = useState("")
  const [remoteCode, setRemoteCode] = useState<string | null>(null)
  const [newVersionString, setNewVersionString] = useState<string | null>(null) // Renamed for clarity

  const { checkUpdate } = useExtensionMarketplace({ script, editorContent })
  const { setScriptCodeMap, setActiveTab, setPendingVersionUpdate } =
    useEditorStore() // Added setPendingVersionUpdate

  const handleCheckForUpdates = useCallback(async () => {
    if (!script.marketplace_id) return

    setIsChecking(true)
    setRemoteCode(null)
    setNewVersionString(null)
    setPendingVersionUpdate(script.id, null) // Clear any previous pending version
    setUpdateMessage(t("extension.checkForUpdates.checking", "正在检查更新..."))
    setDialogOpen(true) // Open dialog when checking starts

    try {
      const latestVersion = await checkUpdate()
      if (latestVersion) {
        setRemoteCode(latestVersion.code)
        setNewVersionString(latestVersion.version)
      }
      if (latestVersion && latestVersion.code !== editorContent) {
        // Assuming script.version exists or is handled; for now, focusing on the new version.
        // It's good practice to ensure script.version is available for a richer message.
        const currentVersionString = script.version
          ? t(
              "extension.checkForUpdates.currentVersion",
              "(current: {{version}})",
              { version: script.version }
            )
          : ""

        // is the same version
        const isSameVersion = latestVersion.version === script.version

        setUpdateMessage(
          isSameVersion
            ? t(
                "extension.checkForUpdates.sameVersionDifferentCode",
                "The remote code for version {{version}} is different from your local code. Would you like to view the changes?",
                { version: latestVersion.version }
              )
            : t(
                "extension.checkForUpdates.updateAvailableViewChanges",
                "New version {{newVersion}} available. {{currentVersionString}} Would you like to view the changes?",
                { newVersion: latestVersion.version, currentVersionString }
              )
        )
      } else if (latestVersion) {
        setUpdateMessage(
          t(
            "extension.checkForUpdates.noNewChanges",
            "You already have the latest code for version {{version}}.",
            { version: latestVersion.version }
          )
        )
      } else {
        setUpdateMessage(
          t("extension.checkForUpdates.noUpdate", "当前已是最新版本。")
        )
      }
    } catch (error) {
      console.error("Error checking for updates:", error)
      setUpdateMessage(
        t(
          "extension.checkForUpdates.error",
          "Error checking for updates. Please try again."
        )
      )
    } finally {
      setIsChecking(false)
    }
  }, [script, editorContent, t, checkUpdate]) // Added script.version to dependencies if used in message

  const handleTriggerClick = useCallback(() => {
    // Dialog is now opened by handleCheckForUpdates
    handleCheckForUpdates()
  }, [handleCheckForUpdates])

  const handleConfirmOrViewChanges = () => {
    if (remoteCode && script.id) {
      setScriptCodeMap(script.id, remoteCode)
      if (newVersionString) {
        setPendingVersionUpdate(script.id, newVersionString) // Set pending version
      }
      setActiveTab("editor") // Corrected: was "code", should be "editor"
    }
    setDialogOpen(false)
    // Reset states after dialog closes, but not pending version, it's cleared by CodeEditor
    setRemoteCode(null)
    // setNewVersionString(null) // Keep for potential re-dialog without re-fetch if needed, or clear if not
  }

  const handleCancel = () => {
    setDialogOpen(false)
    // Reset states after dialog closes
    setRemoteCode(null)
    setNewVersionString(null)
    if (script.id) {
      setPendingVersionUpdate(script.id, null) // Clear pending version on cancel
    }
  }

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Button // Changed AlertDialogTrigger to a direct Button for more control
        variant="ghost"
        size="sm"
        title={t("extension.checkForUpdates.title", "检查更新")}
        onClick={handleTriggerClick} // Use explicit onClick handler
        disabled={!script.marketplace_id || isChecking} // Disable while checking
      >
        {isChecking ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
      </Button>
      {dialogOpen && ( // Conditionally render content to ensure state is fresh
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("extension.checkForUpdates.title", "检查更新")}
            </AlertDialogTitle>
            <AlertDialogDescription>{updateMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} disabled={isChecking}>
              {t("common.cancel", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmOrViewChanges}
              disabled={isChecking}
            >
              {isChecking
                ? t("common.loading", "Loading...")
                : remoteCode
                ? t("extension.checkForUpdates.viewChanges", "View Changes")
                : t("common.ok", "OK")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  )
}
