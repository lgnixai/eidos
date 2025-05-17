"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, KeyRound, Save, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
// ApiKey interface is removed
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { useConfigStore } from "@/apps/web-app/settings/store"
import { EIDOS_SPACE_BASE_URL } from "@/lib/const"

const apiKeyFormSchema = z.object({
  value: z.string().optional(), // Key can be empty to clear it
})

type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>

export default function ApiKeySettingsPage() {
  const { t } = useTranslation()
  const { extensionsManagerKey, setExtensionsManagerKey } = useConfigStore()
  const [showKeyValue, setShowKeyValue] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      value: extensionsManagerKey || "",
    },
  })

  useEffect(() => {
    form.reset({ value: extensionsManagerKey || "" })
  }, [extensionsManagerKey, form])

  const onSubmit = (data: ApiKeyFormValues) => {
    const newKey = data.value?.trim()
    if (newKey && newKey.length > 0) {
      setExtensionsManagerKey(newKey)
      toast({
        title: t("settings.apiKeyManagement.keySaved"),
        description: t("settings.apiKeyManagement.keySavedDescription"),
      })
    } else {
      if (extensionsManagerKey) {
        setExtensionsManagerKey(undefined)
        toast({
          title: t("settings.apiKeyManagement.keyCleared"),
          description: t("settings.apiKeyManagement.keyClearedDescription"),
        })
      }
    }
  }

  const handleClearKey = () => {
    setExtensionsManagerKey(undefined)
    form.reset({ value: "" })
    toast({
      title: t("settings.apiKeyManagement.keyCleared"),
      description: t("settings.apiKeyManagement.keyClearedDescription"),
    })
    setShowClearConfirm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        {/* <KeyRound className="h-6 w-6" /> */}
        <div>
          <h3 className="text-lg font-medium">{t("settings.apiKeyManagement")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("settings.apiKeyManagement.description")}
          </p>
        </div>
      </div>
      <Separator />

      <div className="border rounded-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="p-6">
              <h2 className="text-xl font-semibold leading-none tracking-tight">
                {t("settings.apiKeyManagement.title")}
              </h2>
              <p className="text-sm text-muted-foreground pt-1.5">
                {t("settings.apiKeyManagement.description")}
              </p>
            </div>
            <div className="p-6 pt-0">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.apiKeyManagement.publishingKey")}</FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input
                          type={showKeyValue ? "text" : "password"}
                          placeholder={t("settings.apiKeyManagement.placeholder")}
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowKeyValue(!showKeyValue)}
                        disabled={!field.value}
                        title={showKeyValue ? "Hide key" : "Show key"}
                      >
                        {showKeyValue ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <FormDescription>
                      {t("settings.apiKeyManagement.description")}{" "}
                      <a
                        href={`${EIDOS_SPACE_BASE_URL}/auth/login?redirect=/account?tab=api-keys`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {t("settings.apiKeyManagement.getKeyHere")}
                      </a>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-center justify-between p-6 pt-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowClearConfirm(true)}
                disabled={!extensionsManagerKey}
                className="text-red-600 hover:text-red-700 border-red-600 hover:border-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" /> {t("settings.apiKeyManagement.clearKey")}
              </Button>
              <Button
                type="submit"
                disabled={
                  !form.formState.isDirty &&
                  form.getValues("value") === (extensionsManagerKey || "")
                }
              >
                <Save className="mr-2 h-4 w-4" /> {t("settings.apiKeyManagement.saveKey")}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.apiKeyManagement.confirmClearTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.apiKeyManagement.confirmClearDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearKey}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {t("settings.apiKeyManagement.confirmClear")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
