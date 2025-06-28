import { useParams, useSearchParams, useNavigate } from "react-router-dom"

import { LLMProvider } from "@/packages/ai/config"
import { useAIConfigStore } from "../store"
import { LLMProviderForm } from "./new-llm-provider-form"

export const ProviderPage = () => {
  const { providerId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { aiConfig, addLLMProvider, updateLLMProvider, removeLLMProvider } =
    useAIConfigStore()
  const provider = aiConfig.llmProviders.find((p) => p.name === providerId)

  const existingProviderNames = aiConfig.llmProviders.map((p) => p.name)

  const handleAddProviderAndNavigate = (providerData: LLMProvider) => {
    addLLMProvider(providerData)
    navigate(`/settings/ai/provider/${providerData.name}`)
  }

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
        onAdd={handleAddProviderAndNavigate}
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
