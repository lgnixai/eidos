import { UserConfig, mergeConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import { sharedConfig, createHtmlPlugin, iconJson } from "./shared"

const webAppConfig: UserConfig = mergeConfig(sharedConfig, {
  plugins: [
    createHtmlPlugin('web-app'),
    VitePWA({
      srcDir: "apps/web-app",
      filename: "sw.ts",
      strategies: "injectManifest",
      injectManifest: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,wasm}"],
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "Eidos",
        short_name: "Eidos",
        description: "An extensible framework for managing your personal data throughout your lifetime in one place",
        theme_color: "#ffffff",
        icons: iconJson.icons,
        display_override: ["window-controls-overlay"],
        display: "standalone",
      },
      registerType: "prompt",
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      'csv-parse/sync': 'csv-parse/browser/esm',
      'csv-stringify/sync': 'csv-stringify/browser/esm',
    }
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  },
})

export default webAppConfig 