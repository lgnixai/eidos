import { Plugin, UserConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import fs from "fs"
import wasm from "vite-plugin-wasm"
import topLevelAwait from "vite-plugin-top-level-await"

// enable visualizer if you want to see the size of the package
// import { visualizer } from "rollup-plugin-visualizer"


const iconPath = path.resolve(__dirname, "./icons.json")
const iconJson = JSON.parse(fs.readFileSync(iconPath, "utf-8"))

export const createHtmlPlugin = (serviceMode: string): Plugin => {
  return {
    name: "html-transform",
    enforce: "pre",
    transformIndexHtml: {
      order: "pre",
      handler() {
        const entryMap: {
          [key: string]: string
        } = {
          "ink": "/apps/publish/index.tsx",
          "desktop": "/apps/desktop/renderer/index.tsx",
          "web-app": "/apps/web-app/index.tsx"
        }
        const src = entryMap[serviceMode]
        return [
          {
            tag: "script",
            attrs: { type: "module", src },
            injectTo: "body",
          },
        ]
      },
    },
  }
}

export const sharedAlias = {
  "@/locales": path.resolve(__dirname, "../packages/locales"),
  '@/worker': path.resolve(__dirname, '../packages/worker'),
  '@/lib': path.resolve(__dirname, '../packages/lib'),
  "@": path.resolve(__dirname, "../"),
}

export const sharedConfig: UserConfig = {
  base: '/',
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    // enable visualizer if you want to see the size of the package
    // visualizer({
    //   gzipSize: true,
    //   brotliSize: true,
    //   emitFile: false,
    //   filename: "dev-pkg-vis.html",
    //   open: true,
    // }) as Plugin,
  ],
  resolve: {
    alias: sharedAlias
  },
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm", "whisper-webgpu", "pyodide", "@huacnlee/autocorrect"],
  },
  worker: {
    format: 'es',
    plugins: () => [
      wasm(),
      topLevelAwait()
    ]
  },
}

export { iconJson } 