import { useThemeStore } from "@/lib/store/theme-store"
import {
    parseCSSVariables,
    setThemeVariables
} from '@/lib/web/theme'
import boldTech from "@/styles/themes/bold-tech.css?raw"
import cyberpunk from "@/styles/themes/cyberpunk.css?raw"
import defaultTheme from "@/styles/themes/default.css?raw"
import { useTheme } from "next-themes"
import { useCallback, useEffect } from "react"
import { useAllThemes } from "./use-all-themes"

export const presetThemes = [
    {
        name: "Default",
        css: defaultTheme,
    },
    {
        name: "Cyberpunk",
        css: cyberpunk,
    },
    {
        name: "Bold Tech",
        css: boldTech,
    },
]



export const handleApplyTheme = (rawCss: string, isDarkMode: boolean) => {
    try {
        // Parse both light and dark mode variables
        const lightMatch = /:root\s*{([^}]+)}/.exec(rawCss)
        const darkMatch = /\.dark\s*{([^}]+)}/.exec(rawCss)
        if (!lightMatch && !darkMatch) {
            throw new Error(
                "No valid theme definitions found. Please ensure your CSS includes both :root {...} and .dark {...} blocks."
            )
        }
        if (isDarkMode) {
            if (darkMatch) {
                const darkVariables = parseCSSVariables(darkMatch[1])
                setThemeVariables(darkVariables)
            }
        } else if (lightMatch) {
            const lightVariables = parseCSSVariables(lightMatch[1])
            setThemeVariables(lightVariables)
        }
    } catch (err) {
    }
}

export const useApplyThemeByName = () => {
    const { currentThemeName } = useThemeStore()
    const { theme = "light" } = useTheme()
    const allThemes = useAllThemes()

    const applyTheme = useCallback((theme: string, themeName: string) => {
        const currentThemeName = allThemes.find(t => t.name === themeName)
        if (currentThemeName) {
            handleApplyTheme(currentThemeName.css, theme === "dark")
        }
    }, [allThemes])

    const applyDarkModeSwitch = useCallback((theme: string) => {
        applyTheme(theme, currentThemeName)
    }, [applyTheme, currentThemeName])

    useEffect(() => {
        applyTheme(theme, currentThemeName)
    }, [currentThemeName, theme])

    return {
        applyTheme,
        applyDarkModeSwitch
    }
}