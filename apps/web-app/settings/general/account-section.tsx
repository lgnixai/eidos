import { AlertCircle } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { authClient } from "@/lib/auth-client"
import { DOMAINS } from "@/lib/const"

import { LoginDialog } from "./login-dialog"

interface AccountSectionProps {}

export function AccountSection({}: AccountSectionProps) {
  const { t } = useTranslation()
  const { data: session, isPending, refetch } = authClient.useSession()
  const user = session?.user
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  const handleLogin = async () => {
    setIsLoginDialogOpen(true)
  }

  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast({ title: t("settings.account.logoutSuccess") })
          },
        },
      })
    } catch (error: any) {
      toast({
        title: t("settings.account.logoutFailed"),
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium">
          {t("settings.account.title", "Account")}
        </h3>
      </div>
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          {t(
            "settings.account.testWarning",
            "This is currently for testing, accounts may be deleted later."
          )}
        </AlertDescription>
      </Alert>
      <div className="flex items-center justify-between pt-4">
        <div>
          <h4 className="font-medium">
            {t("settings.account.yourAccount", "Your account")}
          </h4>
          {isPending ? (
            <p className="text-sm text-muted-foreground">
              {t("common.loading", "Loading...")}
            </p>
          ) : user ? (
            <p className="text-sm text-muted-foreground">
              {user.email ??
                t("settings.account.loggedIneNoEmail", "Logged in")}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t(
                "settings.account.notLoggedInDescription",
                "You're not logged in right now. An account is only needed for Eidos Sync, Eidos Capture, Eidos Publish, and API Forwarding."
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isPending ? null : user ? (
            <Button variant="outline" onClick={handleLogout}>
              {t("settings.account.logout", "Log out")}
            </Button>
          ) : (
            <div className="flex flex-col items-start gap-2 w-full shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleLogin}
                className="w-full"
              >
                {t("settings.account.login", "Log in")}
              </Button>
              <Button
                type="button"
                onClick={() =>
                  window.open(DOMAINS.ACCOUNT_REGISTRATION, "_blank")
                }
                className="w-full"
              >
                {t("settings.account.signup", "Sign up")}
              </Button>
            </div>
          )}
        </div>
      </div>
      <LoginDialog
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
        onSuccess={refetch}
      />
    </div>
  )
}
