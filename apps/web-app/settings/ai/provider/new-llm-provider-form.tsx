import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useDebounceFn } from "ahooks"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import * as z from "zod"

import {
  LLMProvider,
  llmProviderSchema as baseLlmProviderSchema,
} from "@/lib/ai/config"
import {
  AvailableModel,
  LLM_PROVIDER_INFO,
  fetchAvailableModels,
} from "@/lib/ai/helper"
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
import { Input } from "@/components/ui/input"
import {
  Tags,
  TagsContent,
  TagsEmpty,
  TagsGroup,
  TagsInput,
  TagsItem,
  TagsList,
  TagsTrigger,
  TagsValue,
} from "@/components/ui/kibo-ui/tags"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/react-hook-form/form"

interface LLMProviderFormProps {
  value?: LLMProvider
  onChange?: (value: LLMProvider) => void
  onAdd?: (data: LLMProvider) => void
  onDelete?: (name: string) => void
  existingNames?: string[]
}

export const LLMProviderForm = ({
  onAdd,
  value,
  onChange,
  onDelete,
  existingNames = [],
}: LLMProviderFormProps) => {
  const { t } = useTranslation()
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([])
  const [isFetchingModels, setIsFetchingModels] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isManualMode, setIsManualMode] = useState(false)
  const [manualModelInput, setManualModelInput] = useState("")

  const navigate = useNavigate()

  const llmProviderSchema = useMemo(() => {
    return baseLlmProviderSchema.refine(
      (data) => {
        if (data.type !== "openai-compatible" && data.type !== "ollama") {
          return true
        }
        const isEditing = !!value
        const originalName = value?.name
        const currentName = data.name

        const nameExists = existingNames
          .filter((name) => !isEditing || name !== originalName)
          .includes(currentName)

        return !nameExists
      },
      {
        message: t("settings.ai.providerNameUniqueError"),
        path: ["name"],
      }
    )
  }, [existingNames, value, t])

  const form = useForm<LLMProvider>({
    resolver: zodResolver(llmProviderSchema),
    defaultValues: value || {
      name: "",
      type: "openai",
      apiKey: "",
      baseUrl: "",
      models: "",
    },
  })
  const { isDirty } = form.formState
  const providerInfo = LLM_PROVIDER_INFO[form.watch("type")]
  const toast = useToast()

  const selectedModelsString = form.watch("models")
  const selectedModelIds = useMemo(() => {
    return selectedModelsString
      ? selectedModelsString
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  }, [selectedModelsString])

  const handleModelSelect = (modelId: string) => {
    if (selectedModelIds.includes(modelId)) return
    const newSelectedIds = [...selectedModelIds, modelId]
    form.setValue("models", newSelectedIds.join(","), {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  const handleModelRemove = (modelId: string) => {
    const newSelectedIds = selectedModelIds.filter((id) => id !== modelId)
    form.setValue("models", newSelectedIds.join(","), {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  const handleManualModelAdd = () => {
    const trimmedInput = manualModelInput.trim()
    if (!trimmedInput || selectedModelIds.includes(trimmedInput)) {
      setManualModelInput("")
      return
    }

    const newSelectedIds = [...selectedModelIds, trimmedInput]
    form.setValue("models", newSelectedIds.join(","), {
      shouldValidate: true,
      shouldDirty: true,
    })
    setManualModelInput("")
  }

  const handleManualInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleManualModelAdd()
    }
  }

  function onSubmit(data: LLMProvider) {
    console.log("onSubmit", data)
    if (onChange) {
      onChange(data)
      toast.toast({
        title: t("common.success"),
        description: t("settings.ai.providerUpdatedSuccess", {
          name: data.name,
        }),
      })
    } else if (onAdd) {
      onAdd(data)
      toast.toast({
        title: t("common.success"),
        description: t("settings.ai.providerAddedSuccess", { name: data.name }),
      })
    }
  }

  function handleDelete(providerName: string) {
    onDelete?.(providerName)
    navigate("/settings/ai")
  }

  const baseUrl = form.watch("baseUrl")
  const apiKey = form.watch("apiKey")
  const providerType = form.watch("type")

  const { run: fetchModels } = useDebounceFn(
    async () => {
      if (!apiKey && providerType !== "ollama") return

      setIsFetchingModels(true)
      setAvailableModels([])

      try {
        const models = await fetchAvailableModels(
          apiKey || "key for ollama",
          providerType,
          baseUrl
        )
        setAvailableModels(models)
      } catch (error) {
        console.error(error)
        setAvailableModels([])
        toast.toast({
          title: t("common.error"),
          description: t("settings.ai.fetchModelListError"),
        })
      } finally {
        setIsFetchingModels(false)
      }
    },
    { wait: 500 }
  )

  // Automatically set apiKey for ollama
  useEffect(() => {
    if (providerType === "ollama") {
      form.setValue("apiKey", "ollama", {
        shouldValidate: false,
        shouldDirty: false,
      })
    }
  }, [providerType, form])

  async function getModelList(
    e?: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    e?.preventDefault()
    fetchModels()
  }

  useEffect(() => {
    // Fetch models automatically for ollama or other providers when apiKey is present
    if (
      providerType === "ollama" ||
      (providerType !== "openai-compatible" && apiKey)
    ) {
      fetchModels()
    }
  }, [providerType, apiKey, baseUrl, fetchModels])

  const mode = onChange ? "Update" : "Add"

  return (
    <Form {...form}>
      <form className="space-y-4">
        {(form.watch("type") === "openai-compatible" ||
          form.watch("type") === "ollama") && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.name")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("settings.ai.providerNamePlaceholder")}
                  />
                </FormControl>
                <FormDescription>
                  {t("settings.ai.providerNameDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {(form.watch("type") === "openai-compatible" ||
          form.watch("type") === "ollama") && (
          <FormField
            name="baseUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("settings.ai.baseUrl")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://api.openai.com/v1" />
                </FormControl>
                <FormDescription>
                  {t("settings.ai.baseUrlDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {form.watch("type") !== "ollama" && (
          <FormField
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("common.apiKey")}</FormLabel>
                <FormControl>
                  <Input {...field} type="password" />
                </FormControl>
                <FormDescription>
                  {t("settings.ai.apiKeyDescription")}
                  {providerInfo?.urlForGettingApiKey && (
                    <span className="ml-1">
                      (
                      <a
                        href={providerInfo.urlForGettingApiKey}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {t("settings.ai.getApiKeyHint")}
                      </a>
                      )
                    </span>
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="models"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>{t("settings.ai.models")}</FormLabel>
                <div className="flex items-center space-x-2">
                  {(form.watch("type") === "openai-compatible" ||
                    form.watch("type") === "ollama") && (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {isManualMode
                          ? t("settings.ai.manualEntry")
                          : t("settings.ai.autoFetch")}
                      </span>
                      <Switch
                        checked={isManualMode}
                        onCheckedChange={setIsManualMode}
                      />
                      {!isManualMode && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={getModelList}
                          disabled={
                            isFetchingModels ||
                            (!form.watch("apiKey") &&
                              form.watch("type") !== "ollama")
                          }
                        >
                          {isFetchingModels ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {t("common.fetch")}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <FormControl>
                {isManualMode ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {selectedModelIds.map((modelId) => (
                        <TagsValue
                          key={modelId}
                          onRemove={() => handleModelRemove(modelId)}
                        >
                          {modelId}
                        </TagsValue>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        placeholder={t("settings.ai.enterModelName")}
                        value={manualModelInput}
                        onChange={(e) => setManualModelInput(e.target.value)}
                        onKeyDown={handleManualInputKeyDown}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleManualModelAdd}
                        disabled={!manualModelInput.trim()}
                      >
                        {t("common.add")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Tags className="w-full">
                    <TagsTrigger className="min-h-[40px] items-start">
                      {selectedModelIds.map((modelId) => (
                        <TagsValue
                          key={modelId}
                          onRemove={() => handleModelRemove(modelId)}
                        >
                          {availableModels.find((m) => m.id === modelId)
                            ?.label || modelId}
                        </TagsValue>
                      ))}
                    </TagsTrigger>
                    <TagsContent>
                      <TagsInput placeholder={t("settings.ai.searchModels")} />
                      <TagsList>
                        <TagsEmpty>{t("settings.ai.noModelsFound")}</TagsEmpty>
                        <TagsGroup>
                          {availableModels
                            .filter(
                              (model) => !selectedModelIds.includes(model.id)
                            )
                            .map((model) => (
                              <TagsItem
                                key={model.id}
                                value={model.id}
                                onSelect={() => handleModelSelect(model.id)}
                              >
                                {model.label}
                              </TagsItem>
                            ))}
                        </TagsGroup>
                        {isFetchingModels && (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" />
                            {t("common.loading")}...
                          </div>
                        )}
                      </TagsList>
                    </TagsContent>
                  </Tags>
                )}
              </FormControl>
              <FormDescription>
                {isManualMode
                  ? t("settings.ai.modelsDescriptionManual")
                  : t("settings.ai.modelsDescription")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex space-x-2">
          {(mode === "Add" || (mode === "Update" && isDirty)) && (
            <Button
              type="button"
              size="sm"
              onClick={form.handleSubmit(onSubmit)}
            >
              {mode === "Update" ? t("common.update") : t("common.add")}
            </Button>
          )}
          {mode === "Update" && value && onDelete && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              {t("common.delete")}
            </Button>
          )}
        </div>
      </form>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.ai.deleteProviderTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.ai.deleteProviderDescription", {
                name: value?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(value!.name)}>
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  )
}
