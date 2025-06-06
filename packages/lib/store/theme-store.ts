import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { createBackendSyncStorage } from "../storage/backend-sync"

export interface CustomTheme {
  name: string
  css: string
}

interface ThemeState {
  currentThemeName: string
  customThemes: CustomTheme[]
  setCurrentThemeName: (name: string) => void
  addCustomTheme: (theme: CustomTheme) => void
  removeCustomTheme: (name: string) => void
  getCustomTheme: (name: string) => CustomTheme | undefined
}

const defaultThemeState = {
  currentThemeName: 'Default',
  customThemes: [],
}

const themeStorage = createBackendSyncStorage<ThemeState>({
  backendConfigKey: "theme",
  getBackendState: (state: ThemeState) => state,
  defaultBackendState: defaultThemeState,
})

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      ...defaultThemeState,
      setCurrentThemeName: (name: string) => {
        set({ currentThemeName: name })
      },
      addCustomTheme: (theme: CustomTheme) => {
        const { customThemes } = get()
        const existingIndex = customThemes.findIndex(t => t.name === theme.name)

        if (existingIndex !== -1) {
          // Update existing theme
          const updatedThemes = [...customThemes]
          updatedThemes[existingIndex] = theme
          set({ customThemes: updatedThemes })
        } else {
          // Add new theme
          set({ customThemes: [...customThemes, theme] })
        }
      },
      removeCustomTheme: (name: string) => {
        const { customThemes } = get()
        set({ customThemes: customThemes.filter(theme => theme.name !== name) })
      },
      getCustomTheme: (name: string) => {
        const { customThemes } = get()
        return customThemes.find(theme => theme.name === name)
      }
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => themeStorage),
    }
  )
) 