import { useEffect } from "react"
import { aiFormSchema, type AIFormValues } from "@/packages/ai/config"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { AIModelSelect } from "@/components/ai-chat/ai-chat-model-select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/react-hook-form/form"

import { TaskType } from "./hooks"
import { ModelTestButton } from "./model-test-button"
import { useAIConfigStore } from "./store"

export function AITaskConfigForm() {
  const { setAiConfig, aiConfig } = useAIConfigStore()
  const form = useForm<AIFormValues>({
    resolver: zodResolver(aiFormSchema),
    defaultValues: aiConfig,
  })
  const { reset } = form
  const { t } = useTranslation()
  const location = useLocation()
  const { isDirty } = form.formState

  useEffect(() => {
    reset(aiConfig)
  }, [aiConfig, reset])

  function onSubmit(data: AIFormValues) {
    setAiConfig(data)
    // data.token = "sk-**********"
  }
  function updateModels(models: string[]) {
    form.setValue("localModels", models)
    form.trigger("localModels")
    onSubmit(form.getValues())
  }

  // function updateProviders(providers: AIFormValues["llmProviders"]) {
  //   form.setValue("llmProviders", providers)
  //   form.trigger("llmProviders")
  //   onSubmit(form.getValues())
  // }

  const getCardClassName = (cardId: string) => {
    return location.hash === `#${cardId}` ? "ring" : ""
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* {!isDesktopMode && (
          <LocalLLMManage
            models={form.getValues("localModels")}
            setModels={updateModels}
          />
        )} */}
        <div
          id="model-preferences"
          className={`space-y-6 rounded-lg border p-4 ${getCardClassName(
            "model-preferences"
          )}`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                {t("settings.ai.modelPreferences")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.ai.modelPreferencesDescription")}
              </p>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={!isDirty}
              className="transition-opacity duration-200"
              style={{
                opacity: isDirty ? 1 : 0,
                pointerEvents: isDirty ? "auto" : "none",
              }}
            >
              {t("common.update")}
            </Button>
          </div>
          <FormField
            control={form.control}
            name="embeddingModel"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel className="w-1/3">
                    {t("settings.ai.embeddingModel")}
                  </FormLabel>
                  <div className="w-2/3 flex space-x-2">
                    <FormControl className="flex-grow">
                      <AIModelSelect
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        localModels={aiConfig.localModels}
                      />
                    </FormControl>
                    <ModelTestButton
                      taskType={TaskType.Embedding}
                      modelValue={field.value}
                    />
                  </div>
                </div>
                <FormDescription>
                  {t("settings.ai.embeddingModelDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="translationModel"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel className="w-1/3">
                    {t("settings.ai.translationModel")}
                  </FormLabel>
                  <div className="w-2/3 flex space-x-2">
                    <FormControl className="flex-grow">
                      <AIModelSelect
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        onlyLocal={false}
                        localModels={aiConfig.localModels}
                      />
                    </FormControl>
                    <ModelTestButton
                      taskType={TaskType.Translation}
                      modelValue={field.value}
                    />
                  </div>
                </div>
                <FormDescription>
                  {t("settings.ai.translationModelDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="codingModel"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel className="w-1/3">
                    {t("settings.ai.codingModel")}
                  </FormLabel>
                  <div className="w-2/3 flex space-x-2">
                    <FormControl className="flex-grow">
                      <AIModelSelect
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        onlyLocal={false}
                        localModels={aiConfig.localModels}
                      />
                    </FormControl>
                    <ModelTestButton
                      taskType={TaskType.Coding}
                      modelValue={field.value}
                    />
                  </div>
                </div>
                <FormDescription>
                  {t("settings.ai.codingModelDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="applyCodeModel"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel className="w-1/3">
                    {t("settings.ai.applyCodeModel")}
                  </FormLabel>
                  <div className="w-2/3 flex space-x-2">
                    <FormControl className="flex-grow">
                      <AIModelSelect
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        onlyLocal={false}
                        localModels={aiConfig.localModels}
                      />
                    </FormControl>
                    <ModelTestButton
                      taskType={TaskType.ApplyCode}
                      modelValue={field.value}
                    />
                  </div>
                </div>
                <FormDescription>
                  {t("settings.ai.applyCodeModelDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  )
}
