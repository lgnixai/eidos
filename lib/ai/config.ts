import { z } from "zod"

import { LLMProviderType } from "@/lib/ai/helper"


// Define the enum using all provider types directly
const providerTypes: [LLMProviderType, ...LLMProviderType[]] = [
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
    // "luma",
    "openai-compatible",
];

export const llmProviderSchema = z.object({
    type: z.enum(providerTypes).default("openai"),
    name: z.string(),
    apiKey: z.string().optional(),
    baseUrl: z.string().url().optional().or(z.literal('')),
    models: z.string().default(""),
    enabled: z.boolean().optional(),
})

export type LLMProvider = z.infer<typeof llmProviderSchema>

export const aiFormSchema = z.object({
    localModels: z.array(z.string()).default([]),
    llmProviders: z.array(llmProviderSchema).default([]),
    // runtime
    autoLoadEmbeddingModel: z.boolean().default(false),
    // task model
    embeddingModel: z.string().optional(),
    translationModel: z.string().optional(),
    codingModel: z.string().optional(),
})

export type AIFormValues = z.infer<typeof aiFormSchema>