// interface FileSystemDirectoryHandle {
//   [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>
//   entries(): AsyncIterableIterator<[string, FileSystemHandle]>
//   keys(): AsyncIterableIterator<string>
//   values(): AsyncIterableIterator<FileSystemHandle>
// }

interface ImportMeta {
  env: Record<string, unknown>
}

//github.com/BenjaminAster/TypeScript-types-for-new-JavaScript/blob/main/wicg/window-controls-overlay.d.ts
// Window Controls Overlay
// Specification: https://wicg.github.io/window-controls-overlay/
// Repository: https://github.com/WICG/window-controls-overlay
interface Navigator {
  windowControlsOverlay: WindowControlsOverlay
}

interface HTMLWebViewElement {
  contentWindow: Window
}

interface WindowControlsOverlay extends EventTarget {
  readonly visible: boolean
  getTitlebarAreaRect(): DOMRect
  ongemometrychange:
  | ((
    this: WindowControlsOverlay,
    ev: WindowControlsOverlayGeometryChangeEvent
  ) => any)
  | null
  addEventListener<K extends keyof WindowControlsOverlayEventMap>(
    type: K,
    listener: (
      this: WindowControlsOverlay,
      ev: WindowControlsOverlayEventMap[K]
    ) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof WindowControlsOverlayEventMap>(
    type: K,
    listener: (
      this: WindowControlsOverlay,
      ev: WindowControlsOverlayEventMap[K]
    ) => any,
    options?: boolean | EventListenerOptions
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void
}

interface WindowControlsOverlayEventMap {
  geometrychange: WindowControlsOverlayGeometryChangeEvent
}

declare class WindowControlsOverlayGeometryChangeEvent extends Event {
  constructor(
    type: string,
    eventInitTict: WindowControlsOverlayGeometryChangeEventInit
  )
  readonly titlebarAreaRect: DOMRect
  readonly visible: boolean
}

interface WindowControlsOverlayGeometryChangeEventInit extends EventInit {
  titlebarAreaRect: DOMRect
  visible?: boolean
}

interface Window {
  eidos: {
    invoke: (type: string, data: any) => Promise<any>
    on: (channel: string, listener: any) => string | undefined
    off: (channel: string, listenerId: string) => void
    efsManager: any
    spaceList: string[]
    spaceFileSystem: any
    openTabs: string[]
    config: any
    selectFolder: () => Promise<string | undefined>
    openFolder: (folder: string) => Promise<void>
    isDataFolderSet: boolean
    isNeverCreatedSpace: boolean
    checkIsDataFolderSet: () => boolean
    checkIsNeverCreatedSpace: () => Promise<boolean>
    reloadApp: () => Promise<void>
    minimizeWindow: () => void
    maximizeWindow: () => void
    unmaximizeWindow: () => void
    closeWindow: () => void
    onWindowStateChange: (callback: (state: 'maximized' | 'restored') => void) => () => void
    initializePlayground: (space: string, blockId: string, files: any[]) => Promise<string>
    getApiAgentStatus: () => Promise<any>
    onApiAgentStatusChanged: (callback: (status: any) => void) => () => void
    fetch: (url: string, options: RequestInit) => Promise<any>
    openUrl: (url: string) => Promise<void>
  }
} 