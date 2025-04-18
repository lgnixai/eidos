import type { ModelRecord } from "@mlc-ai/web-llm";

import {
  WEB_LLM_MODELS,
  modelLibURLPrefix,
  modelVersion,
} from "@/components/ai-chat/webllm/models";

import { efsManager } from "../storage/eidos-file-system";

import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createAzure } from "@ai-sdk/azure";
import { createCerebras } from "@ai-sdk/cerebras";
import { createCohere } from "@ai-sdk/cohere";
import { createDeepInfra } from "@ai-sdk/deepinfra";
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createFireworks } from "@ai-sdk/fireworks";
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createPerplexity } from "@ai-sdk/perplexity";
import { createTogetherAI } from "@ai-sdk/togetherai";
import { createXai } from '@ai-sdk/xai';
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { OpenAI } from "openai";

export type Model = (typeof WEB_LLM_MODELS)[0]



export type LLMProviderType =
  "openai" |
  "google" |
  "deepseek" |
  "groq" |
  "xai" |
  "openrouter" |
  "anthropic" |
  "azure" |
  "amazon-bedrock" |
  // "fal" |
  "deepinfra" |
  "mistral" |
  "togetherai" |
  "cohere" |
  "fireworks" |
  "cerebras" |
  // "replicate" |
  "perplexity" |
  "ollama" |
  // "luma" |
  "openai-compatible"


export const ALL_PROVIDERS_RAW = [
  "openai",
  "google",
  "deepseek",
  "groq",
  "xai",
  "openrouter",
  "anthropic",
  "azure",
  "amazon-bedrock",
  // "fal",
  "deepinfra",
  "mistral",
  "togetherai",
  "cohere",
  "fireworks",
  "cerebras",
  // "replicate",
  "perplexity",
  "ollama",
  // "luma",
  "openai-compatible",
]


export const LLM_PROVIDER_INFO: Record<LLMProviderType, {
  name: string
  baseUrl: string
  urlForGettingApiKey?: string
}> = {
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
  },
  google: {
    name: "Google AI",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta", // Or Vertex AI endpoint
    urlForGettingApiKey: "https://aistudio.google.com/apikey"
  },
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
  },
  groq: {
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
  },
  xai: {
    name: "xAI (Grok)",
    baseUrl: "https://api.x.ai/v1",
    urlForGettingApiKey: "https://docs.x.ai/docs/overview"
  },
  openrouter: {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    urlForGettingApiKey: "https://openrouter.ai/settings/keys",
  },
  anthropic: {
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
  },
  azure: {
    name: "Azure OpenAI",
    baseUrl: "YOUR_AZURE_ENDPOINT", // User specific
  },
  "amazon-bedrock": {
    name: "Amazon Bedrock",
    baseUrl: "https://bedrock-runtime.<region>.amazonaws.com", // User/region specific
  },
  // fal: {
  //   name: "Fal AI",
  //   baseUrl: "https://fal.run/v1", // Placeholder, check docs
  // },
  deepinfra: {
    name: "DeepInfra",
    baseUrl: "https://api.deepinfra.com/v1/openai",
  },
  mistral: {
    name: "Mistral AI",
    baseUrl: "https://api.mistral.ai/v1",
  },
  togetherai: {
    name: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
  },
  cohere: {
    name: "Cohere",
    baseUrl: "https://api.cohere.ai/v1",
  },
  fireworks: {
    name: "Fireworks AI",
    baseUrl: "https://api.fireworks.ai/inference/v1",
  },
  cerebras: {
    name: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1", // Placeholder, check docs
  },
  // replicate: {
  //   name: "Replicate",
  //   baseUrl: "https://api.replicate.com/v1",
  // },
  perplexity: {
    name: "Perplexity AI",
    baseUrl: "https://api.perplexity.ai",
  },
  // luma: {
  //   name: "Luma AI",
  //   baseUrl: "https://api.luma.ai/v1", // Placeholder, check docs
  // },
  ollama: {
    name: "Ollama",
    baseUrl: "http://localhost:11434/v1",
  },
  "openai-compatible": {
    name: "OpenAI Compatible",
    baseUrl: "YOUR_COMPATIBLE_ENDPOINT", // User specific
  },
}

// order by name alphabetically
export const ALL_PROVIDERS = Object.keys(LLM_PROVIDER_INFO).sort() as LLMProviderType[]

export interface AvailableModel {
  id: string
  label: string
}

export async function fetchAvailableModels(
  apiKey: string,
  providerType: LLMProviderType,
  baseUrl?: string
): Promise<AvailableModel[]> {
  if (!apiKey) {
    return []
  }
  const providerInfo = LLM_PROVIDER_INFO[providerType]
  const _baseUrl = baseUrl || providerInfo.baseUrl

  // Special handling for Google's API
  if (providerType === 'google') {
    try {
      const endpoint = `${_baseUrl}/models?key=${apiKey}`
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch Google models: ${response.statusText}`);
      }
      const data = await response.json();
      return data.models.map((model: { name: string; displayName: string }) => ({
        id: model.name.split('/').pop() || model.name,
        label: model.name.split('/').pop() || model.displayName || model.name,
      }));
    } catch (error) {
      console.error('Failed to fetch Google models:', error);
      return [];
    }
  }


  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: _baseUrl,
    dangerouslyAllowBrowser: true,
  })

  try {
    const resp = await openai.models.list()
    return resp.data.map((model) => ({
      id: model.id,
      label: model.id,
    }))
  } catch (error) {
    console.error('Failed to fetch models:', error)
    return []
  }
}

interface ModelFileListRecord {
  name: string
  shape: [number, number]
  dtype: string
  format: string
  nbytes: number
  byteOffset: number
}

interface ModelFileList {
  metadata: {
    ParamSize: number
    ParamBytes: number
    BitsPerParam: number
  }
  records: {
    dataPath: string
    format: string
    nbytes: number
    records: ModelFileListRecord[]
    md5sum: string
  }[]
}

export const getLocalModelList = (modelIds: string[], origin: string) => {
  return modelIds.map((modelId) => {
    const originalModel = WEB_LLM_MODELS.find(
      (item) => item.model_id === modelId
    )
    const wasmFileName = originalModel?.model_lib.split("/").pop()

    return {
      ...originalModel,
      model: new URL("/static/webllm/models/" + modelId + "/", origin).href,
      model_lib: new URL("/static/webllm/wasm/" + wasmFileName, origin).href,
    }
  }) as ModelRecord[]
}

export const downloadWebLLM = async (
  model: Model,
  signal: AbortSignal,
  cb?: (progress: number) => void
) => {
  const downloadModelFile = async (
    modelsDir: string[],
    name: string,
    baseUrl: string = model.model + "/resolve/main/"
  ) => {
    const isFileExist = await efsManager.checkFileExists([...modelsDir, name])
    if (isFileExist) {
      return await efsManager.getFile([...modelsDir, name])
    }
    const fileResp = await fetch(baseUrl + name, { signal })
    if (fileResp.ok) {
      const file = new File([await fileResp.blob()], name)
      await efsManager.addFile(modelsDir, file)
      return file
    }
    throw new Error("Failed to download model file")
  }

  // download wasm lib
  const wasmDir = ["static", "webllm", "wasm"]
  const name = model.model_lib.split("/").pop()
  downloadModelFile(wasmDir, name!, modelLibURLPrefix + modelVersion + "/")

  cb?.(0.03)
  // download model weights
  await efsManager.addDir(["static", "webllm", "models"], model.model_id)
  const modelsDir = [
    "static",
    "webllm",
    "models",
    model.model_id,
    "resolve",
    "main",
  ]

  const fileListJSONFile = await downloadModelFile(
    modelsDir,
    "ndarray-cache.json"
  )
  cb?.(0.04)
  const fileList = JSON.parse(await fileListJSONFile.text()) as ModelFileList
  const fileLists = ["mlc-chat-config.json", "tokenizer.json"]
  for (const file of fileLists) {
    await downloadModelFile(modelsDir, file)
  }
  cb?.(0.05)

  let downloadedBytes = 0
  for (const record of fileList.records) {
    await downloadModelFile(modelsDir, record.dataPath)
    downloadedBytes += record.nbytes
    cb?.(downloadedBytes / fileList.metadata.ParamBytes)
  }
}

export function getProvider(data: {
  apiKey?: string,
  baseUrl?: string,
  type?: LLMProviderType
}) {
  const { apiKey, baseUrl, type = 'openai' } = data
  const config: any = {
    apiKey
  }
  if (baseUrl) {
    config.baseURL = baseUrl
  }
  switch (type) {
    case 'openai':
      return createOpenAI(config)
    case 'google':
      return createGoogleGenerativeAI(config)
    case 'deepseek':
      return createDeepSeek(config)
    case 'groq':
      return createGroq(config)
    case 'xai':
      return createXai(config)
    case 'anthropic':
      return createAnthropic(config)
    case 'azure':
      return createAzure(config)
    case 'amazon-bedrock':
      return createAmazonBedrock(config)
    case 'mistral':
      return createMistral(config)
    case 'cohere':
      return createCohere(config)
    // case 'replicate':
    //   return createReplicate(config)
    case 'perplexity':
      return createPerplexity(config)
    case 'openrouter':
      return createOpenRouter(config)
    // case 'fal':
    //   return createFal(config)
    case 'deepinfra':
      return createDeepInfra(config)
    case 'togetherai':
      return createTogetherAI(config)
    case 'fireworks':
      return createFireworks(config)
    case 'cerebras':
      return createCerebras(config)
    // case 'luma':
    //   return createLuma(config)
    case 'openai-compatible':
    case 'ollama':
    default:
      if (!baseUrl) {
        console.warn(`Base URL is missing for OpenAI compatible provider type: ${type}. Falling back to OpenAI default or OpenAICompatible with potentially incorrect base URL.`);
      }
      return createOpenAI({
        baseURL: baseUrl,
        apiKey,
      })
  }
}
