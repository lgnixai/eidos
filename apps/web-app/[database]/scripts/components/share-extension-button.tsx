import { useCallback, useState } from "react"
import { IScript } from "@/worker/web-worker/meta-table/script"
import { Share2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { authClient } from "@/lib/auth-client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { LoginDialog } from "@/components/login-dialog"

import { useExtensionMarketplace } from "../hooks/use-extension-marketplace"

interface ShareExtensionButtonProps {
  script: IScript
  onSuccess: () => void
}

export const ShareExtensionButton = ({
  script,
  onSuccess,
}: ShareExtensionButtonProps) => {
  const { t } = useTranslation()
  const { isSubmitting, submitExtension, isPublishing, publishNewVersion } =
    useExtensionMarketplace({
      script,
      editorContent: script.ts_code || script.code,
    })
  const { data: session, refetch } = authClient.useSession()
  const user = session?.user
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [loginFromShare, setLoginFromShare] = useState(false)

  const handleSubmitOrPublish = useCallback(async () => {
    if (script.marketplace_id) {
      await publishNewVersion()
    } else {
      await submitExtension()
    }
    onSuccess()
    setShareDialogOpen(false)
  }, [script, publishNewVersion, submitExtension, onSuccess])

  const handleConfirmClick = useCallback(() => {
    if (user) {
      handleSubmitOrPublish()
    } else {
      setLoginFromShare(true)
      setIsLoginDialogOpen(true)
      setShareDialogOpen(false)
    }
  }, [user, handleSubmitOrPublish])

  const handleLoginSuccess = useCallback(() => {
    refetch()
    if (loginFromShare) {
      setLoginFromShare(false)
      setShareDialogOpen(true)
    }
  }, [refetch, loginFromShare])

  return (
    <>
      <AlertDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            title="Share Extension"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share this Extension?</AlertDialogTitle>
            <AlertDialogDescription>
              {!user
                ? "You need to be logged in to share an extension. Click 'Confirm & Log in' to open the login dialog."
                : script.marketplace_id
                ? "This action will update the existing public extension listing with the current code and metadata. Are you sure you want to proceed?"
                : "This action will submit the current code as a new public extension to the marketplace. Are you sure you want to proceed?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting || isPublishing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClick}
              disabled={isSubmitting || isPublishing}
            >
              {isSubmitting || isPublishing
                ? "Submitting..."
                : !user
                ? "Confirm & Log in"
                : script.marketplace_id
                ? "Confirm & Publish"
                : "Confirm & Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <LoginDialog
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
        onSuccess={handleLoginSuccess}
      />
    </>
  )
}
