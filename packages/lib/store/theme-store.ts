import { create } from "zustand"
import { persist } from "zustand/middleware"

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

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentThemeName: 'Default',
      customThemes: [],
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
      getStorage: () => localStorage,
    }
  )
) 