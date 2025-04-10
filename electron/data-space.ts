import { EidosDataEventChannelName, EidosMessageChannelName } from "@/lib/const";
import { DataSpace, EidosDatabase } from "@/worker/web-worker/DataSpace";
import { WebContents, ipcMain } from "electron";
import { getEidosFileSystemManager } from './file-system/getEidosFileSystemManager';
import { getSpaceDbPath } from "./file-system/space";
import { win } from "./main";
import { NodeServerDatabase } from "./sqlite-server";
import { getResourcePath } from "./helper";
import { EventEmitter } from 'events';
import { getConfigManager } from "./config";


// --- START: Helper function to apply Graft Config to Environment --- 
function applyGraftConfigToEnv(): void {
    try {
        const configManager = getConfigManager();
        const isSyncEnabled = configManager.isSyncEnabled();
        const graftConfig = configManager.getGraftConfig();
        if (!isSyncEnabled) {
            console.log('Sync is disabled, skipping Graft config application');
            return;
        }
        console.log('Applying Graft config to environment variables:', graftConfig);

        // Only set env vars if the corresponding config value is present
        if (graftConfig.metastore) {
            process.env.GRAFT_METASTORE = graftConfig.metastore;
            console.log(`Set GRAFT_METASTORE=${graftConfig.metastore}`);
        }
        if (graftConfig.pagestore) {
            process.env.GRAFT_PAGESTORE = graftConfig.pagestore;
            console.log(`Set GRAFT_PAGESTORE=${graftConfig.pagestore}`);
        }
        if (graftConfig.token) { // Check if token exists
            process.env.GRAFT_TOKEN = graftConfig.token;
            console.log(`Set GRAFT_TOKEN=***`); // Avoid logging the actual token
        } else {
            // Ensure env var is unset if config value is missing/undefined
            delete process.env.GRAFT_TOKEN;
            console.log('Unset GRAFT_TOKEN');
        }
        // Always set autosync (default is true)
        process.env.GRAFT_AUTOSYNC = String(graftConfig.autosync);
        console.log(`Set GRAFT_AUTOSYNC=${graftConfig.autosync}`);

        if (graftConfig.clientId) { // Check if clientId exists
            process.env.GRAFT_CLIENT_ID = graftConfig.clientId;
            console.log(`Set GRAFT_CLIENT_ID=${graftConfig.clientId}`);
        } else {
            // Ensure env var is unset if config value is missing/undefined
            delete process.env.GRAFT_CLIENT_ID;
            console.log('Unset GRAFT_CLIENT_ID');
        }
        // GRAFT_DIR is not handled here as NodeServerDatabase manages the file path directly.
        // If the rust extension absolutely needs GRAFT_DIR, it might require further changes.

    } catch (error) {
        console.error('Failed to read graft config or set environment variables:', error);
        // Decide if this is fatal. For now, just log and continue.
    }
}
// --- END: Helper function --- 

function requestFromRenderer(webContents: WebContents, arg: any) {
    return new Promise((resolve, reject) => {
        const requestId = Math.random().toString(36).substr(2, 9);

        ipcMain.once(`response-${requestId}`, (event: any, result: any) => {
            resolve(result);
        });

        webContents.send('request-from-main', requestId, arg);
    });
}

async function initUDF(db: EidosDatabase) {
    const scripts = await db.selectObjects(
        `SELECT DISTINCT name, code FROM eidos__scripts WHERE type = 'udf' AND enabled = 1`
    )
    for (const script of scripts) {
        const { code, name } = script
        const dynamicFunc = new Function("return (" + code + ")")();
        db.createFunction({
            name,
            xFunc: dynamicFunc
        })
    }
}


export class DataSpaceManager {
    private static instance: DataSpaceManager;
    private dataSpace: DataSpace | null = null;

    private constructor() { }

    public static getInstance(): DataSpaceManager {
        if (!DataSpaceManager.instance) {
            DataSpaceManager.instance = new DataSpaceManager();
        }
        return DataSpaceManager.instance;
    }

    public getDataSpace(): DataSpace | null {
        return this.dataSpace;
    }

    public async reload(): Promise<DataSpace | null> {
        if (!this.dataSpace) {
            return null;
        }

        const spaceName = this.dataSpace.dbName;
        // Close current dataspace
        this.dataSpace.close();
        this.dataSpace = null;

        // Reinitialize with the same space name
        return this.getOrSetDataSpace(spaceName);
    }

    public async close(): Promise<boolean> {
        if (!this.dataSpace) {
            return false;
        }

        // Close current dataspace
        this.dataSpace.close();
        this.dataSpace = null;
        return true;
    }

    public async getOrSetDataSpace(spaceName: string, enableSync: boolean = false, volumeId?: string): Promise<DataSpace> {
        if (this.dataSpace && this.dataSpace.dbName !== spaceName) {
            // Close both main and draft databases when switching to a different space
            this.dataSpace.close();
        } else if (this.dataSpace) {
            // If same space, return existing instance
            return this.dataSpace;
        }
        console.log("init space", spaceName)
        const libPath = getResourcePath(`dist-simple/libsimple`);
        const dictPath = getResourcePath('dist-simple/dict');
        const graftLibPath = getResourcePath('dist-simple/libgraft');
        const vecLibPath = getResourcePath('dist-simple/vec');

        // --- START: Set Graft Environment Variables from Config ---
        applyGraftConfigToEnv(); // Call the helper function
        // --- END: Set Graft Environment Variables from Config ---

        const serverDb = new NodeServerDatabase({
            path: getSpaceDbPath(spaceName),
            options: {
                timeout: 3000,
            }
        }, {
            simple: {
                libPath,
                dictPath,
            },
            graft: {
                libPath: graftLibPath,
            },
            vec: {
                libPath: vecLibPath,
            },
            enableSync,
            volumeId
        });

        const draftDataSpace = new DataSpace({
            db: new NodeServerDatabase({
                path: ':memory:',
            }, {
                simple: {
                    libPath,
                    dictPath,
                },
                enableSync: false
            }),
            activeUndoManager: false,
            dbName: 'draft',
            context: {
                setInterval,
            },
            hasLoadExtension: true,
            dataEventChannel: new BroadcastChannel('draft-data-event-channel')
        });

        const efsManager = await getEidosFileSystemManager();

        const dataEventEmitter = new EventEmitter();

        const dataEventChannel = {
            name: EidosDataEventChannelName,
            postMessage: (data: any) => {
                win?.webContents.send(EidosDataEventChannelName, data);

                // delay to emit event to avoid query busy
                setTimeout(() => {
                    dataEventEmitter.emit('message', { data });
                }, 100)
            },
            set onmessage(handler: (event: { data: any }) => void) {
                dataEventEmitter.removeAllListeners('message');
                if (handler) {
                    dataEventEmitter.on('message', handler);
                }
            },
            onmessageerror: null,
            addEventListener: (type: string, listener: EventListener) => {
                dataEventEmitter.on(type, listener);
            },
            removeEventListener: (type: string, listener: EventListener) => {
                dataEventEmitter.off(type, listener);
            },
            dispatchEvent: (event: Event): boolean => {
                return dataEventEmitter.emit(event.type, event);
            },
            close: () => {
                dataEventEmitter.removeAllListeners('message');
            }
        };

        this.dataSpace = new DataSpace({
            db: serverDb,
            activeUndoManager: false,
            dbName: spaceName,
            context: {
                setInterval,
            },
            createUDF: initUDF,
            hasLoadExtension: true,
            postMessage: (data: any, transfer?: any[]) => {
                win?.webContents.send(EidosMessageChannelName, data, transfer);
            },
            callRenderer: (type: any, data: any) => {
                return requestFromRenderer(win!.webContents, { type, data });
            },
            dataEventChannel: dataEventChannel,
            efsManager: efsManager,
            draftDb: draftDataSpace,
            enableFTS: true
        });

        return this.dataSpace;
    }
}


// Export convenience functions
export function getDataSpace(): DataSpace | null {
    return DataSpaceManager.getInstance().getDataSpace();
}

export function getOrSetDataSpace(spaceName: string, enableSync: boolean = false, volumeId?: string): Promise<DataSpace> {
    return DataSpaceManager.getInstance().getOrSetDataSpace(spaceName, enableSync, volumeId);
}

export function reloadDataSpace(): Promise<{ success: boolean }> {
    DataSpaceManager.getInstance().reload();
    return Promise.resolve({
        success: true
    });
}

export async function closeDataSpace(): Promise<{ success: boolean }> {
    const success = await DataSpaceManager.getInstance().close();
    return {
        success
    };
}
