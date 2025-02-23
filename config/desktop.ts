import esmShim from '@rollup/plugin-esm-shim'
import path from "path"
import { Plugin, UserConfig, mergeConfig } from "vite"
import electron from 'vite-plugin-electron/simple'
import { createHtmlPlugin, sharedConfig } from "./shared"
import fs from "fs/promises"


// desktop do not need android and windows11
const copyPublicPlugin = (): Plugin => {
  return {
    name: 'copy-public',
    closeBundle: async () => {
      const publicDir = path.resolve(__dirname, '../public')
      const distDir = path.resolve(__dirname, '../dist')
      console.log('dir', publicDir, distDir)

      try {
        await fs.mkdir(distDir, { recursive: true })

        const copyDirRecursive = async (src: string, dest: string) => {
          const entries = await fs.readdir(src, { withFileTypes: true })

          for (const entry of entries) {
            const srcPath = path.join(src, entry.name)
            const destPath = path.join(dest, entry.name)

            if (entry.name === 'android' || entry.name === 'windows11') {
              continue
            }

            if (entry.isDirectory()) {
              await fs.mkdir(destPath, { recursive: true })
              await copyDirRecursive(srcPath, destPath)
            } else {
              await fs.copyFile(srcPath, destPath)
            }
          }
        }

        await copyDirRecursive(publicDir, distDir)
      } catch (err) {
        console.error('Error copying public files:', err)
      }
    }
  }
}

const desktopConfig: UserConfig = mergeConfig(sharedConfig, {
  plugins: [
    createHtmlPlugin('desktop'),
    copyPublicPlugin(),
    electron({
      main: {
        entry: [
          'electron/main.ts',
          'electron/worker.ts',
        ],
        vite: {
          resolve: {
            alias: {
              "@": path.resolve(__dirname, "../"),
            },
          },
          build: {
            rollupOptions: {
              plugins: [
                esmShim() as unknown as Plugin,
              ],
              external: [
                'better-sqlite3',
              ]
            },
          },
        }
      },
      preload: {
        input: 'electron/preload.ts',
        vite: {
          resolve: {
            alias: {
              "@": path.resolve(__dirname, "../"),
            },
          },
          build: {
            rollupOptions: {
              output: {
                format: 'es',
                inlineDynamicImports: true,
                entryFileNames: '[name].mjs',
                chunkFileNames: '[name].mjs',
                assetFileNames: '[name].[ext]',
              },
            },
          },
        },
      },
    }),
  ],
  build: {
    rollupOptions: {
      external: ['electron'],
    },
    copyPublicDir: false,
    assetsDir: 'assets',
    assetsInclude: ['**/*'],
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      'csv-parse/sync': 'csv-parse/sync',
      'csv-stringify/sync': 'csv-stringify/sync',
    }
  },
})

export default desktopConfig 