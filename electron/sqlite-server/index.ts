import { BaseServerDatabase } from '@/lib/sqlite/interface';
import Database from '@eidos.space/better-sqlite3';
import console from 'electron-log';
import fs from 'fs';
import path from 'path';
import { generatePragmaList } from './config';
import { parseGraftStatus, parsePagesStatus } from '@/lib/sync/graft/helpers';


export interface NodeDomainDbInfo {
    type: 'node';
    config: {
        path: string;
        options?: Database.Options;
    };
}

interface NodeServerDatabaseOptions {
    enableSync: boolean,
    volumeId?: string,
    // for full text search
    simple: {
        libPath: string;
        dictPath: string;
    },
    // for sync
    graft?: {
        libPath: string;
    },
    // vec extension
    vec?: {
        libPath: string;
    }
}

export class NodeServerDatabase extends BaseServerDatabase {
    isSyncEnabled: boolean = false;
    db: Database.Database | null = null;
    options: NodeServerDatabaseOptions | null = null

    constructor(config: NodeDomainDbInfo['config'], options: NodeServerDatabaseOptions) {
        super();
        console.log('Initializing NodeServerDatabase...');
        console.log('Options:', options);
        console.log('Config:', config);
        this.options = options;

        try {
            // 1. Register Graft VFS if necessary
            if (options.graft?.libPath) {
                // Use a short-lived memory db just to load the extension library
                // This is necessary to register the 'graft' VFS system-wide
                const vfsRegistrationDb = new Database(':memory:');
                try {
                    console.log('Loading graft extension library to register VFS:', options.graft.libPath);
                    vfsRegistrationDb.loadExtension(options.graft.libPath);
                    console.log('Graft extension library loaded, VFS should be registered.');
                } catch (err: any) {
                    console.error('Failed to load graft extension library:', err);
                    // This is likely a fatal error for sync functionality
                    throw new Error(`Failed to load graft VFS extension from ${options.graft.libPath}: ${err.message}`);
                } finally {
                    vfsRegistrationDb.close();
                }
            } else if (options.enableSync) {
                console.warn('enableSync is true, but graft.libPath is not provided. Sync functionality will likely fail.');
            } else {
                console.log('Graft extension path not provided (sync likely disabled).');
            }

            // Determine if sync mode (via graft VFS) should be attempted
            const graftFilePath = path.join(path.dirname(config.path), 'graft');
            const isSyncDbFilePresent = fs.existsSync(graftFilePath);
            this.isSyncEnabled = (isSyncDbFilePresent || options.enableSync) && !!options.graft?.libPath;
            console.log(`Sync mode check: enableSync=${options.enableSync}, graftFilePresent=${isSyncDbFilePresent}, graftLibPathProvided=${!!options.graft?.libPath}, result=${this.isSyncEnabled}`);

            // 2. Determine the database URI
            const dbUri = this._determineDbUri(config, options, graftFilePath, isSyncDbFilePresent);
            console.log('Determined dbUri:', dbUri);

            // 3. Create the main database connection
            console.log('Creating main database instance...');
            // Make sure to pass original config options if any were intended
            this.db = new Database(dbUri, config.options);
            console.log('Main database instance created.');

            // 4. Initialize the main database connection (Extensions, Pragmas)
            this._initializeDatabaseConnection(options);

            // 5. Load the Vec extension
            this.loadVecExtension(this.db);
            console.log('NodeServerDatabase initialized successfully.');

        } catch (error) {
            console.error('Error during NodeServerDatabase initialization:', error);
            // Clean up if necessary (e.g., close this.db if partially opened)
            if (this.db && this.db.open) {
                try {
                    this.db.close();
                    console.log('Closed partially opened database due to initialization error.');
                } catch (closeError) {
                    console.error('Error closing database during error handling:', closeError);
                }
            }
            throw error; // Re-throw the error to signal failure
        }
    }

    loadVecExtension(db: Database.Database) {
        if (this.options?.vec?.libPath) {
            db.loadExtension(this.options.vec.libPath);
            const { sqlite_version, vec_version } = db
                .prepare(
                    "select sqlite_version() as sqlite_version, vec_version() as vec_version;",
                )
                .get() as any;
            console.log(`sqlite_version=${sqlite_version}, vec_version=${vec_version}`);
            const result = db
                .prepare("select vec_f32(?) as result")
                .get('[1.0,2.0,3.0]');
            console.log('result', result)
        }
    }

    enableSimpleExtension(db: Database.Database, options: {
        libPath: string;
        dictPath: string;
    }) {
        db.loadExtension(options.libPath);
        const row = db.prepare('select simple_query(\'pinyin\') as query').get() as any;
        console.log(row.query);
        db.prepare("select jieba_dict(?)").run(options.dictPath);
    }

    // Helper function to determine the DB URI
    private _determineDbUri(
        config: NodeDomainDbInfo['config'],
        options: {
            enableSync: boolean,
            volumeId?: string,
            graft?: { libPath: string; }
        },
        graftFilePath: string,
        isSyncDbFilePresent: boolean
    ): string {
        console.log(`Determining DB URI using pre-calculated isSyncEnabled=${this.isSyncEnabled}`);

        let dbUri = config.path; // Default to local file path

        if (this.isSyncEnabled) {
            console.log('Sync DB mode selected.');
            let dbId = options.volumeId || null;

            if (isSyncDbFilePresent) {
                const fileContent = fs.readFileSync(graftFilePath, 'utf-8').trim();
                if (fileContent) {
                    console.log('Read existing dbId from graft file:', fileContent);
                    dbId = fileContent;
                } else {
                    console.log('Graft file exists but is empty. Will attempt to generate ID.');
                }
            } else {
                console.log('Graft file does not exist.');
                if (options.enableSync) {
                    console.log('enableSync is true, will attempt to generate ID and create graft file.');
                } else {
                    console.warn('Graft file missing and enableSync is false. Sync may not function as expected.');
                }
            }

            // Generate a new ID if needed (and sync is enabled or file exists)
            if (!dbId && (options.enableSync || isSyncDbFilePresent)) {
                console.log('dbId not found or invalid, generating new one using "file:random?vfs=graft"...');
                let tempIdDb: Database.Database | null = null;
                try {
                    // This relies on the graft VFS being registered in the constructor's step 1
                    tempIdDb = new Database('file:random?vfs=graft');
                    const dbList = tempIdDb.pragma('database_list') as any[];
                    // Ensure dbList exists and has the expected structure
                    if (!dbList || dbList.length === 0 || !dbList[0] || typeof dbList[0].file !== 'string') {
                        throw new Error('Invalid response from PRAGMA database_list when generating ID.');
                    }
                    const generatedId = dbList[0].file;

                    // Basic sanity check on the generated ID
                    if (!generatedId || generatedId === 'random' || generatedId === ':memory:') {
                        throw new Error(`Failed to generate a valid database ID using graft VFS. Received: ${generatedId}`);
                    }

                    dbId = path.basename(generatedId); // Extract the ID part if it's a path
                    console.log('Generated new dbId:', dbId);

                    fs.writeFileSync(graftFilePath, dbId);
                    console.log('Saved new dbId to graft file:', graftFilePath);
                } catch (err: any) {
                    console.error("Error generating database ID with graft VFS:", err);
                    // Propagate a more informative error
                    throw new Error(`Failed to generate/save database ID for graft VFS: ${err.message}`);
                } finally {
                    // Ensure the temporary DB is closed even if errors occurred
                    tempIdDb?.close();
                }
            }

            if (!dbId) {
                // If we still don't have an ID after attempting generation, it's an error.
                throw new Error("Failed to obtain a database ID for graft VFS operation.");
            }

            // Construct the final URI using the obtained/generated ID
            dbUri = `file:${dbId}?vfs=graft`;

        } else if (options.enableSync && !options.graft?.libPath) {
            // Log if sync was requested but library wasn't provided
            console.warn('enableSync is true, but graft.libPath is not provided. Falling back to non-sync URI.');
            dbUri = config.path; // Fall back to default path
        } else {
            // Standard non-sync operation
            console.log('Using standard file path (non-sync mode).');
            dbUri = config.path;
        }

        return dbUri;
    }


    // Helper function to initialize the connection (load extensions, apply pragmas)
    private _initializeDatabaseConnection(options: {
        simple: { libPath: string; dictPath: string; },
        // Add other options if needed by initialization steps
    }) {
        console.log('Initializing database connection settings (extensions, pragmas)...');
        if (!this.db) {
            // This should ideally not happen if called after successful DB creation
            throw new Error("Database not initialized before calling _initializeDatabaseConnection");
        }

        // Load Simple extension if dictionary exists
        if (fs.existsSync(options.simple.dictPath)) {
            try {
                console.log('Attempting to enable simple extension...');
                this.enableSimpleExtension(this.db, options.simple);
                console.log('Simple extension enabled successfully.');
            } catch (err) {
                console.error('Failed to enable simple extension:', err);
                // Decide if this is fatal. For now, just log and continue.
                // Consider re-throwing if simple extension is critical:
                // throw new Error(`Failed to enable simple extension: ${err.message}`);
            }
        } else {
            console.warn('Simple dictionary file not found, skipping simple extension enablement:', options.simple.dictPath);
        }

        // Apply Pragma settings
        try {
            console.log('Applying PRAGMA settings...');
            const pragmaList = generatePragmaList();
            pragmaList.forEach(pragma => {
                console.log(`Executing PRAGMA: ${pragma}`);
                if (!this.db) throw new Error("Database is not initialized.");
                // Ensure pragma string is correctly formatted if it contains values
                this.db.pragma(pragma);
            });
            console.log('PRAGMA settings applied successfully.');
        } catch (err) {
            console.error('Failed to apply PRAGMA settings:', err);
            // Decide if this is fatal. For now, just log and continue.
            // Consider re-throwing if pragmas are critical:
            // throw new Error(`Failed to apply PRAGMA settings: ${err.message}`);
        }
    }

    prepare(sql: string) {
        if (!this.db) throw new Error("Database is not initialized.");
        return this.db.prepare(sql)
    }
    close() {
        if (!this.db) {
            console.warn("Attempted to close an uninitialized database.");
            return; // Or throw error depending on desired behavior
        }
        this.db.close();
    }


    async reset(): Promise<{ [key: string]: any; }> {
        if (!this.isSyncEnabled) {
            // throw new Error("Reset operation is only available in sync mode.");
            console.warn("Reset operation called but sync is not enabled. Returning empty object.");
            return {}; // Return empty object instead of throwing
        }
        if (!this.db) throw new Error("Database is not initialized.");
        const rawResult = this.db.pragma('graft_reset');
        console.log(rawResult)
        return {}
    }

    async pages() {
        if (!this.isSyncEnabled) {
            // throw new Error("Pages operation is only available in sync mode.");
            console.warn("Pages operation called but sync is not enabled. Returning empty promise.");
            return Promise.resolve({}); // Return promise resolving to empty object
        }
        if (!this.db) throw new Error("Database is not initialized.");
        const rawResult = this.db.pragma('graft_pages');
        console.log('Raw graft_pages:', rawResult);

        if (!rawResult || !Array.isArray(rawResult) || rawResult.length === 0 || typeof rawResult[0] !== 'object' || rawResult[0] === null) {
            console.error('Unexpected graft_pages format:', rawResult);
            // Return a structured error or throw? Returning promise for now.
            return Promise.resolve({ error: 'Unexpected format from pragma graft_pages' });
        }

        const pagesString = Object.values(rawResult[0])[0];

        if (typeof pagesString !== 'string') {
            console.error('Expected string value in graft_pages result:', pagesString);
            return Promise.resolve({ error: 'Expected string value from pragma graft_pages' });
        }

        const parsedResult = parsePagesStatus(pagesString)
        return parsedResult
    }

    async status() {
        if (!this.isSyncEnabled) {
            // throw new Error("Status operation is only available in sync mode.");
            console.warn("Status operation called but sync is not enabled. Returning empty promise.");
            return Promise.resolve({}); // Return promise resolving to empty object
        }
        if (!this.db) throw new Error("Database is not initialized.");
        const rawResult = this.db.pragma('graft_status');
        // console.log('Raw graft_status:', rawResult);

        if (!rawResult || !Array.isArray(rawResult) || rawResult.length === 0 || typeof rawResult[0] !== 'object' || rawResult[0] === null) {
            console.error('Unexpected graft_status format:', rawResult);
            // Return a structured error or throw? Returning promise for now.
            return Promise.resolve({ error: 'Unexpected format from pragma graft_status' });
        }

        // Assuming the actual status string is the value of the first key in the first object
        const statusString = Object.values(rawResult[0])[0];

        if (typeof statusString !== 'string') {
            console.error('Expected string value in graft_status result:', statusString);
            return Promise.resolve({ error: 'Expected string value from pragma graft_status' });
        }

        const parsedStatus = parseGraftStatus(statusString);

        // console.log('Parsed graft_status:', parsedStatus);
        return Promise.resolve(parsedStatus);
    }


    getGraftInfo(db: Database.Database) {
        return {
            graft_snapshot: db.pragma('graft_snapshot'),
            graft_pages: db.pragma('graft_pages'),
            graft_version: db.pragma('graft_version'),
            graft_sync_errors: db.pragma('graft_sync_errors'),
        }
    }

    getLocksInfo() {
        if (!this.db) throw new Error("Database is not initialized.");
        return {
            lockingMode: this.db.pragma('locking_mode'),
            walSize: this.db.pragma('wal_size'),
            pageSize: this.db.pragma('page_size'),
            cacheSize: this.db.pragma('cache_size'),
            busyTimeout: this.db.pragma('busy_timeout'),
            foreignKeys: this.db.pragma('foreign_keys'),
        };
    }

    async selectObjects(sql: string, bind?: any[]): Promise<{ [columnName: string]: any }[]> {
        if (!this.db) throw new Error("Database is not initialized.");
        const stmt = this.db.prepare(sql);
        if (bind != null) {
            return stmt.all(bind) as { [columnName: string]: any }[];
        }
        return stmt.all() as { [columnName: string]: any }[];
    }

    transaction(func: (db: NodeServerDatabase) => void) {
        if (!this.db) throw new Error("Database is not initialized.");
        // Use non-null assertion operator since the check above guarantees non-nullability
        const transaction = this.db!.transaction(func);
        transaction(this);
        return
    }

    async exec(opts: { sql: string; bind?: any[]; rowMode?: "array" | "object" }) {
        if (!this.db) throw new Error("Database is not initialized.");
        if (typeof opts === 'string') {
            const res = this.db.exec(opts);
            return res
        } else if (typeof opts === 'object') {
            const { sql, bind } = opts;
            const _bind = bind?.map((item: any) => {
                // if item is boolean return 1 or 0
                if (typeof item === 'boolean') {
                    return item ? 1 : 0;
                }
                return item;
            })
            const stmt = this.db.prepare(sql);
            let res = null
            if (stmt.readonly) {
                res = stmt.all(_bind);
            } else {
                if (_bind == null) {
                    return stmt.run();
                }
                try {
                    return stmt.run(_bind);
                } catch (error) {
                    console.error("Error executing statement:", error);
                    console.error("SQL:", sql);
                    console.error("Bind:", _bind);
                    throw error
                }
            }
            if (opts.rowMode === 'array') {
                return res.map((item: any) => Object.values(item));
            }
            return res
        }
        return [];
    }

    createFunction(opt: { name: string; xFunc: (...args: any[]) => any }) {
        if (!this.db) throw new Error("Database is not initialized.");
        this.db.function(opt.name, {
            deterministic: true,
        }, opt.xFunc)
    }
}