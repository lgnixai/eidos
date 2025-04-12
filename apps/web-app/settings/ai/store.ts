import { z } from "zod"
import { create } from "zustand"
// can use anything: IndexedDB, Ionic Storage, etc.
import { createJSONStorage, persist } from "zustand/middleware"

import { LLMProviderType } from "@/lib/ai/helper"

import { indexedDBStorage } from "@/lib/storage/indexeddb"
import { AIFormValues, LLMProvider } from "@/lib/ai/config"


interface ConfigState {
  aiConfig: AIFormValues
  setAiConfig: (aiConfig: AIFormValues) => void
  addLLMProvider: (provider: LLMProvider) => void
  updateLLMProvider: (provider: LLMProvider) => void
  removeLLMProvider: (name: string) => void
}

// Define a custom storage object that syncs with both IndexedDB and backend config
const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // Get from IndexedDB as the primary source on load
    return indexedDBStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // Set in IndexedDB
    await indexedDBStorage.setItem(name, value);
    // Also set in backend config
    try {
      // 'value' is a JSON string representing the state { state: ..., version: ... }
      const parsedState = JSON.parse(value);
      // Assuming window.eidos.config.set expects the actual config object
      // Use the relevant key for the backend configuration, e.g., 'aiConfig'
      if (window.eidos?.config?.set && parsedState.state?.aiConfig) {
        await window.eidos.config.set('ai', parsedState.state.aiConfig);
      }
    } catch (error) {
      console.error("Failed to parse state or set backend config:", error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    // Remove from IndexedDB
    await indexedDBStorage.removeItem(name);
    // Also remove/reset in backend config
    try {
      // Set the corresponding backend config key to a default/empty state
      if (window.eidos?.config?.set) {
        // Use the default state structure matching AIFormValues
        await window.eidos.config.set('ai', {
          localModels: [],
          llmProviders: [],
          autoLoadEmbeddingModel: false,
          embeddingModel: undefined, // Ensure all fields are reset if needed
          translationModel: undefined,
          codingModel: undefined,
        });
      }
    } catch (error) {
      console.error("Failed to remove/reset backend config:", error);
    }
  },
};

export const useAIConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      aiConfig: {
        localModels: [],
        llmProviders: [],
        autoLoadEmbeddingModel: false,
      },
      setAiConfig: (aiConfig) => set({ aiConfig }),
      addLLMProvider: (provider: LLMProvider) =>
        set((state) => ({
          aiConfig: {
            ...state.aiConfig,
            llmProviders: [...state.aiConfig.llmProviders, provider],
          },
        })),
      updateLLMProvider: (provider: LLMProvider) =>
        set((state) => ({
          aiConfig: {
            ...state.aiConfig,
            llmProviders: state.aiConfig.llmProviders.map((p) => (p.name === provider.name ? provider : p)),
          },
        })),
      removeLLMProvider: (name: string) =>
        set((state) => ({
          aiConfig: {
            ...state.aiConfig,
            llmProviders: state.aiConfig.llmProviders.filter((p) => p.name !== name),
          },
        })),
    }),
    {
      name: "config-ai",
      // Use the custom storage wrapper
      storage: createJSONStorage(() => customStorage),
    }
  )
)
