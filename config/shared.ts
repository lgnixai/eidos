import { Plugin, UserConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import fs from "fs"

// enable visualizer if you want to see the size of the package
// import { visualizer } from "rollup-plugin-visualizer"


const iconPath = path.resolve(__dirname, "../icons.json")
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
          "desktop": "/apps/desktop/index.tsx",
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

export const sharedConfig: UserConfig = {
  base: '/',
  plugins: [
    react(),
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
    alias: {
      "@": path.resolve(__dirname, "../"),
    },
  },
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm", "whisper-webgpu", "pyodide"],
  },
  worker: {
    format: 'es',
  },
}

export { iconJson } 