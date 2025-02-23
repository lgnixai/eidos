import { defineConfig } from 'vite'
import webAppConfig from './config/web-app'
import desktopConfig from './config/desktop'
import inkConfig from './config/ink'
import coreConfig from './config/core'

const serviceMode = process.env.EIDOS_SERVICE_MODE || 'web-app'

const configMap = {
  'web-app': webAppConfig,
  'desktop': desktopConfig,
  'ink': inkConfig,
  'core': coreConfig,
}

export default defineConfig(configMap[serviceMode as keyof typeof configMap])
