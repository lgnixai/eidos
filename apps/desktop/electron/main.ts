import { MsgType } from '@/lib/const';
import { handleFunctionCall } from '@/lib/rpc';
import { BrowserWindow, Menu, Tray, app, dialog, ipcMain, nativeImage, shell } from 'electron';
import { log } from 'electron-log';
import path from 'path';
import { getConfigManager } from './config';
import { closeDataSpace, getDataSpace, getOrSetDataSpace, reloadDataSpace } from './data-space';
import { initializePlayground } from './file-system/playground';
import { getResourcePath } from './helper';
import { ProtocolHandler } from './protocol-handler';
import { getApiAgentStatus, initApiAgent } from './server/api-agent';
import { startServer } from './server/server';
import { AppUpdater } from './updater';
import { createWindow } from './window-manager/createWindow';
import { WorkerManager } from './worker-manager';

export let win: BrowserWindow | null
let appUpdater: AppUpdater;
let tray: Tray | null
let protocolHandler: ProtocolHandler;
let forceQuit = false;

export const PORT = 13127;


const libPath = getResourcePath(`dist-simple/libsimple`);
const dictPath = getResourcePath('dist-simple/dict');
const simplePathConfig = {
    libPath,
    dictPath
}

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
// The built directory structure
//
// ├─┬ dist
// │ ├─┬ electron
// │ │ ├── main.js
// │ │ └── preload.js
// │ ├── index.html
// │ ├── ...other-static-files-from-public
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
    ? process.env.DIST
    : path.join(process.env.DIST, '../public')


startServer({ dist: process.env.DIST, port: PORT });

if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

ipcMain.handle('get-app-data-folder', () => {
    return getConfigManager().get('dataFolder');
});

ipcMain.handle('get-config', (event, key) => {
    return getConfigManager().get(key);
});

ipcMain.handle('set-config', (event, key, value) => {
    getConfigManager().set(key, value);
});

ipcMain.handle('get-user-config-path', () => {
    return path.join(app.getPath('userData'), 'config.json');
});

ipcMain.handle('sqlite-msg', async (event, payload) => {
    let dataSpace = getDataSpace()
    const { space, dbName } = payload.data
    const spaceId = space || dbName
    if (!dataSpace) {
        log('not found data space')
        const { space, dbName } = payload.data
        dataSpace = await getOrSetDataSpace(dbName || space)
        log('switch to data space', dataSpace.dbName)
    } else if (spaceId !== dataSpace.dbName) {
        log('switch to data space', dataSpace.dbName)
        dataSpace = await getOrSetDataSpace(dbName || space)
    }
    const res = await handleFunctionCall(payload.data, dataSpace)
    return res
});


ipcMain.handle('sqlite-msg-read', async (event, payload) => {
    return WorkerManager.getInstance().executeTask(payload, {
        simplePathConfig
    });
});


ipcMain.handle(MsgType.SwitchDatabase, (event, args) => {
    const { databaseName, id } = args
    // Perform the database switch logic here
    const data = { dbName: databaseName } // Example response data
    getOrSetDataSpace(databaseName)
    return { id, data }
})

ipcMain.handle(MsgType.Pull, async (event, args) => {
    const { spaceName } = args
    const dataSpace = await getOrSetDataSpace(spaceName)
    return dataSpace?.pull()
})
ipcMain.handle(MsgType.Reset, async (event, args) => {
    const { spaceName } = args
    const dataSpace = await getOrSetDataSpace(spaceName)
    return dataSpace?.reset()
})

ipcMain.handle(MsgType.Status, async (event, args) => {
    const { spaceName } = args
    const dataSpace = await getOrSetDataSpace(spaceName)
    return dataSpace?.status()
})

ipcMain.handle(MsgType.Pages, async (event, args) => {
    const { spaceName } = args
    const dataSpace = await getOrSetDataSpace(spaceName)
    return dataSpace?.pages()
})


ipcMain.handle(MsgType.CreateSpace, (event, args) => {
    const { spaceName, enableSync, volumeId } = args
    const data = { spaceName }
    getOrSetDataSpace(spaceName, enableSync, volumeId)
    return { data }
})

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (result.canceled) {
        return undefined;
    } else {
        return result.filePaths[0];
    }
});

ipcMain.handle('open-folder', (event, folder) => {
    if (folder) {
        shell.openPath(folder)
            .then((result) => {
                if (result) {
                    log(`Error opening folder: ${result}`);
                } else {
                    log(`Folder opened successfully: ${folder}`);
                }
            })
            .catch((error) => {
                log(`Error opening folder: ${error}`);
            });
    } else {
        log('No folder path provided');
    }
});

ipcMain.handle('reload-app', () => {
    app.relaunch();
    win?.reload()
});

app.on('window-all-closed', () => {
    WorkerManager.getInstance().shutdown();
    getDataSpace()?.close()
    win = null
})


ipcMain.handle('check-for-updates', () => {
    appUpdater.checkForUpdates();
});

ipcMain.handle('quit-and-install', () => {
    forceQuit = true;
    appUpdater.quitAndInstall();
});

ipcMain.handle('initialize-playground', (event, space, blockId, files) => {
    return initializePlayground(space, blockId, files)
});




app.on('before-quit', () => {
    forceQuit = true;
});

function createTray() {
    if (process.platform === 'darwin') {
        return
    }
    try {
        const iconPath = path.join(process.env.VITE_PUBLIC, 'logo.png');
        log('Tray icon path:', iconPath);

        const icon = nativeImage.createFromPath(iconPath);
        tray = new Tray(icon);

        const contextMenu = Menu.buildFromTemplate([
            { label: 'show', click: () => win?.show() },
            { label: 'exit', click: () => { forceQuit = true; app.quit(); } }
        ]);

        tray.setToolTip('Eidos');
        tray.setContextMenu(contextMenu);

        log('Tray created successfully');
    } catch (error) {
        log('Error creating tray:', error);
    }
}

function destroyTray() {
    if (tray) {
        tray.destroy();
        tray = null;
    }
}

if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('eidos', process.execPath, [path.resolve(process.argv[1])])
    }
} else {
    app.setAsDefaultProtocolClient('eidos')
}

app.on('open-url', (event, url) => {
    event.preventDefault();
    if (protocolHandler) {
        protocolHandler.handleUrl(url);
    }
});

app.on('second-instance', (event, commandLine) => {
    const protocolUrl = commandLine.find(arg => arg.startsWith('eidos://'));
    if (protocolUrl && protocolHandler) {
        protocolHandler.handleUrl(protocolUrl);
    }

    if (win) {
        if (win.isMinimized()) win.restore();
        win.focus();
    }
});

app.whenReady().then(() => {
    win = createWindow();
    const configManager = getConfigManager();

    configManager.on('configChanged', ({ key, newValue }: { key: string, newValue: unknown }) => {
        if (key === 'security') {
            console.log('security changed', newValue)
        }
    });
    createTray();

    protocolHandler = new ProtocolHandler(win);

    win.on('close', (event) => {
        if (!forceQuit) {
            if (process.platform === 'darwin') {
                event.preventDefault();
                win?.hide();
            } else {
                forceQuit = true;
                destroyTray();
                app.quit();
            }
        }
    });
    appUpdater = new AppUpdater(win);
    appUpdater.checkForUpdates();
    initApiAgent();

    ipcMain.handle('get-api-agent-status', () => {
        return getApiAgentStatus();
    });
});

app.on('activate', () => {
    if (win) {
        win.show();
    }
});

ipcMain.handle('quit-app', () => {
    forceQuit = true;
    destroyTray();
    getDataSpace()?.close();
    app.quit();
});

ipcMain.handle('reload-query-worker', async () => {
    console.log('prepare for import')
    // Importing CSV will enable exclusive locks, causing read-only sqlite worker queries to timeout. We directly shut down all workers before importing CSV
    WorkerManager.getInstance().shutdown();
    return { success: true };
});

ipcMain.handle('reload-data-space', async () => {
    return reloadDataSpace();
});

ipcMain.handle('close-data-space', async () => {
    return closeDataSpace();
});

ipcMain.handle('fetch', async (event, url, options) => {
    try {
        const res = await fetch(url, options);
        let data;
        const contentType = res.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else if (contentType && contentType.startsWith('text/')) {
            data = await res.text();
        } else {
            // Default or handle other types like blob/arrayBuffer if needed
            // For now, let's try text as a fallback or indicate unsupported type
            try {
                data = await res.text(); // Attempt to read as text
            } catch (parseError) {
                console.error('Failed to parse response body:', parseError);
                data = null; // Or indicate error in data field
            }
        }

        // Return a serializable object
        return {
            ok: res.ok,
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries()), // Convert Headers object to plain object
            data: data
        };
    } catch (error) {
        console.error('Fetch error in main process:', error);
        // Return a serializable error structure
        return {
            ok: false,
            status: 500, // Or determine status based on error type
            statusText: 'Internal Server Error',
            headers: {},
            data: null,
            error: error instanceof Error ? error.message : 'Unknown fetch error'
        };
    }
});
