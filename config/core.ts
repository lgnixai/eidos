import { UserConfig } from "vite"
import path from "path"

const coreConfig: UserConfig = {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../"),
    }
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, '../worker/web-worker/DataSpace.ts'),
      name: 'DataSpace',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: [
        '@sqlite.org/sqlite-wasm',
        'eventemitter3',
        'nanoid',
        'postal-mime',
      ],
      output: {
        format: 'es',
        manualChunks: undefined,
        generatedCode: 'es2015',
        minifyInternalExports: false,
        banner: `import { Buffer } from "node:buffer";`
      }
    },
    outDir: 'packages/core',
    copyPublicDir: false,
    emptyOutDir: false,
    minify: false,
    sourcemap: true
  }
}

export default coreConfig 