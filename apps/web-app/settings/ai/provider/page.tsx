import { useParams, useSearchParams } from "react-router-dom"

import { useAIConfigStore } from "../store"
import { LLMProviderForm } from "./new-llm-provider-form"

export const ProviderPage = () => {
  const { providerId } = useParams()
  const [searchParams] = useSearchParams()
  const { aiConfig, addLLMProvider, updateLLMProvider, removeLLMProvider } =
    useAIConfigStore()
  const provider = aiConfig.llmProviders.find((p) => p.name === providerId)

  const existingProviderNames = aiConfig.llmProviders.map((p) => p.name)

  const isAddNew = providerId === "new"

  if (isAddNew) {
    const type = searchParams.get("type") as any
    const name = searchParams.get("name") as string

    const defaultBaseUrl = type === "ollama" ? "http://localhost:11434/v1" : ""

    return (
      <LLMProviderForm
        value={{
          type,
          name: name,
          models: "",
          apiKey: "",
          baseUrl: defaultBaseUrl,
          enabled: true,
        }}
        onAdd={addLLMProvider}
        existingNames={existingProviderNames}
      ></LLMProviderForm>
    )
  }
  return (
    <LLMProviderForm
      value={provider}
      onChange={updateLLMProvider}
      onDelete={removeLLMProvider}
      existingNames={existingProviderNames}
    ></LLMProviderForm>
  )
}
