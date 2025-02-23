import { UserConfig, mergeConfig } from "vite"
import { sharedConfig, createHtmlPlugin } from "./shared"

const inkConfig: UserConfig = mergeConfig(sharedConfig, {
  plugins: [
    createHtmlPlugin('ink'),
  ],
  resolve: {
    alias: {
      'csv-parse/sync': 'csv-parse/browser/esm',
      'csv-stringify/sync': 'csv-stringify/browser/esm',
    }
  },
  server: {
    proxy: {
      "/server/api": "http://localhost:8000",
    },
  },
})

export default inkConfig 