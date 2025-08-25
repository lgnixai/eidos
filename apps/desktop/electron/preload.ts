import { EidosFileSystemManager } from '@/lib/storage/eidos-file-system';
import { SpaceFileSystem } from '@/lib/storage/space';
import { contextBridge, ipcRenderer } from 'electron';
import { getOriginPrivateDirectory } from 'native-file-system-adapter';

import type { AppConfig } from './config/index';
import type { PlaygroundFile } from './file-system/playground';
import nodeAdapter from './lib/node-adapter';
import type { ApiAgentStatus } from './server/api-agent';

type IpcListener = (event: Electron.IpcRendererEvent, ...args: any[]) => void;


let spaceFileSystem: SpaceFileSystem | null = null;

async function getSpaceFileSystem() {
  const userDataPath = (await ipcRenderer.invoke('get-app-data-folder'));
  const dirHandle = await getOriginPrivateDirectory(nodeAdapter, userDataPath)
  return new SpaceFileSystem(dirHandle as any)
}


async function main() {
  const userDataPath = (await ipcRenderer.invoke('get-app-data-folder'));
  const openTabs = await ipcRenderer.invoke('get-open-tabs') as string[]
  const dirHandle = await getOriginPrivateDirectory(nodeAdapter, userDataPath)

  spaceFileSystem = await getSpaceFileSystem()

  const listenerMap = new Map<string, Map<string, IpcListener>>();
  let listenerIdCounter = 0;



  const checkIsNeverCreatedSpace = async () => {
    const userDataPath = (await ipcRenderer.invoke('get-app-data-folder'));
    const dirHandle = await getOriginPrivateDirectory(nodeAdapter, userDataPath)
    const spaceFileSystem = new SpaceFileSystem(dirHandle as any)
    return (await spaceFileSystem.list()).length === 0
  }

  const isSpaceExist = async (space: string) => {
    const userDataPath = (await ipcRenderer.invoke('get-app-data-folder'));
    const dirHandle = await getOriginPrivateDirectory(nodeAdapter, userDataPath)
    const spaceFileSystem = new SpaceFileSystem(dirHandle as any)
    return spaceFileSystem.list().then(spaces => spaces.includes(space))
  }

  const checkIsDataFolderSet = async () => {
    const dataFolder = await ipcRenderer.invoke('get-config', 'dataFolder')
    return !!dataFolder
  }



  // we expose a readonly version of eidos, which only contains a invoke method
  //  eidosReadonly -> sqlite-msg-read -> main -> worker
  contextBridge.exposeInMainWorld('eidosReadonly', {
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
      const [channel, ...omit] = args
      return ipcRenderer.invoke(channel, ...omit)
    },
  })

  // --------- Expose some API to the Renderer process ---------
  contextBridge.exposeInMainWorld('eidos', {
    on(channel: string, listener: IpcListener) {
      if (typeof channel !== 'string' || typeof listener !== 'function') {
        throw new Error('Invalid parameters for add listener for channel: ' + channel);
      }
      if (!listenerMap.has(channel)) {
        listenerMap.set(channel, new Map());
      }

      const channelListeners = listenerMap.get(channel)!;
      const listenerId = `listener_${++listenerIdCounter}`;

      const wrappedListener = (event: Electron.IpcRendererEvent, ...args: any[]) => {
        try {
          listener(event, ...args);
        } catch (error) {
          console.error(`Error in listener for ${channel}:`, error);
        }
      };

      channelListeners.set(listenerId, wrappedListener);
      ipcRenderer.on(channel, wrappedListener);

      return listenerId;
    },

    off(channel: string, listenerId: string) {
      if (typeof channel !== 'string' || typeof listenerId !== 'string') {
        throw new Error('Invalid parameters for remove listener for channel: ' + channel);
      }

      const channelListeners = listenerMap.get(channel);
      if (!channelListeners) return;

      const wrappedListener = channelListeners.get(listenerId);
      if (!wrappedListener) return;

      channelListeners.delete(listenerId);
      ipcRenderer.removeListener(channel, wrappedListener);

      if (channelListeners.size === 0) {
        listenerMap.delete(channel);
      }
    },

    removeAllListeners(channel?: string) {
      if (channel) {
        const channelListeners = listenerMap.get(channel);
        if (channelListeners) {
          for (const [_, listener] of channelListeners) {
            ipcRenderer.removeListener(channel, listener);
          }
          listenerMap.delete(channel);
        }
      } else {
        for (const [channel, listeners] of listenerMap) {
          for (const [_, listener] of listeners) {
            ipcRenderer.removeListener(channel, listener);
          }
        }
        listenerMap.clear();
      }
    },

    send(...args: Parameters<typeof ipcRenderer.send>) {
      const [channel, ...omit] = args
      return ipcRenderer.send(channel, ...omit)
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
      const [channel, ...omit] = args
      return ipcRenderer.invoke(channel, ...omit)
    },
    postMessage(...args: Parameters<typeof ipcRenderer.postMessage>) {
      const [channel, ...omit] = args
      return ipcRenderer.postMessage(channel, ...omit)
    },
    openTabs: openTabs,
    // versions
    chrome: process.versions.chrome,
    node: process.versions.node,

    efsManager: new EidosFileSystemManager(dirHandle as any),
    spaceFileSystem: spaceFileSystem,
    config: {
      get: (key: keyof AppConfig) => ipcRenderer.invoke('get-config', key),
      set: (key: keyof AppConfig, value: any) => ipcRenderer.invoke('set-config', key, value),
    },
    isSpaceExist: isSpaceExist,
    isDataFolderSet: await checkIsDataFolderSet(),
    isNeverCreatedSpace: await checkIsNeverCreatedSpace(),
    checkIsDataFolderSet: checkIsDataFolderSet,
    checkIsNeverCreatedSpace: checkIsNeverCreatedSpace,
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    openFolder: (folder: string) => ipcRenderer.invoke('open-folder', folder),
    openUrl: (url: string) => ipcRenderer.invoke('open-url', url),
    reloadApp: () => ipcRenderer.invoke('reload-app'),
    initializePlayground: (space: string, blockId: string, files: PlaygroundFile[]) => ipcRenderer.invoke('initialize-playground', space, blockId, files),
    minimizeWindow: () => ipcRenderer.send('window-control', 'minimize'),
    maximizeWindow: () => ipcRenderer.send('window-control', 'maximize'),
    unmaximizeWindow: () => ipcRenderer.send('window-control', 'unmaximize'),
    closeWindow: () => ipcRenderer.send('window-control', 'close'),

    onWindowStateChange: (callback: (state: 'maximized' | 'restored') => void) => {
      const listener = (_: any, state: string) => {
        if (state === 'maximized' || state === 'restored') {
          callback(state);
        }
      };
      ipcRenderer.on('window-state-changed', listener);
      return () => ipcRenderer.removeListener('window-state-changed', listener);
    },

    // You can expose other APIs you need here.
    // ...

    // Add these new properties to eidos object
    onApiAgentStatusChanged: (callback: (status: ApiAgentStatus) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: ApiAgentStatus) => callback(status);
      ipcRenderer.on('api-agent-status-changed', listener);

      return () => {
        console.log('remove listener')
        ipcRenderer.removeListener('api-agent-status-changed', listener);
      };
    },
    getApiAgentStatus: () => ipcRenderer.invoke('get-api-agent-status'),

    fetch(url: string, options: RequestInit = {}): Promise<Response> {
      return ipcRenderer.invoke('fetch', url, options).then((data: any) => {
        // Create a simple Response-like object
        return {
          ok: data.ok,
          status: data.status,
          statusText: data.statusText,
          headers: new Headers(data.headers),
          url: data.url,

          async text() {
            return new TextDecoder().decode(data.body);
          },

          async json() {
            const text = new TextDecoder().decode(data.body);
            return JSON.parse(text);
          },

          async blob() {
            const contentType = data.headers['content-type'] || 'application/octet-stream';
            return new Blob([data.body], { type: contentType });
          },

          async arrayBuffer() {
            return data.body;
          }
        } as Response;
      });
    }
  })

}

main()
