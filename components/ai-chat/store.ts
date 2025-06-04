import { create } from "zustand"


type Store = {
  currentSysPrompt: string
  setCurrentSysPrompt: (value: string) => void
}

export const useAIChatStore = create<Store>((set) => ({
  currentSysPrompt: "base",
  setCurrentSysPrompt: (value) => set(() => ({ currentSysPrompt: value })),
}))

