import { isDesktopMode } from "@/lib/env";
import { DataSpace } from "../DataSpace";

export class TableFullTextSearch {
    constructor(private dataspace: DataSpace) { }

    async createDynamicFTS(tableName: string, temporary: boolean = false) {
        const tableInfo = await this.dataspace.db.selectObjects(`PRAGMA table_info(${tableName})`);
        if (!isDesktopMode) {
            throw new Error('Full text search is not supported in web mode');
        }

        const columns = tableInfo
            .map((col: any) => col.name)
            .filter((name: any) => name.toLowerCase() !== 'rowid')
            .join(', ');

        const ftsTableName = `fts_${tableName}`;

        const createFtsSql = `
        CREATE VIRTUAL TABLE IF NOT EXISTS ${ftsTableName}
        USING fts5(${columns}, content='${tableName}', content_rowid='rowid', tokenize = 'simple');
        `;

        try {
            // 开始一个事务
            await this.dataspace.db.exec('BEGIN IMMEDIATE TRANSACTION');

            await this.dataspace.db.exec(createFtsSql);
            await this.dataspace.db.exec(`INSERT INTO ${ftsTableName}(${ftsTableName}) VALUES('rebuild');`);

            if (!temporary) {
                const triggerSqls = [
                    `CREATE TRIGGER IF NOT EXISTS fts_${tableName}_ai AFTER INSERT ON ${tableName} BEGIN
                        INSERT INTO ${ftsTableName}(rowid, ${columns}) 
                        VALUES (new.rowid, ${columns.split(',').map(c => `new.${c.trim()}`).join(',')});
                    END;`,

                    `CREATE TRIGGER IF NOT EXISTS fts_${tableName}_ad AFTER DELETE ON ${tableName} BEGIN
                        INSERT INTO ${ftsTableName}(${ftsTableName}, rowid) VALUES('delete', old.rowid);
                    END;`,

                    `CREATE TRIGGER IF NOT EXISTS fts_${tableName}_au AFTER UPDATE ON ${tableName} BEGIN
                        INSERT INTO ${ftsTableName}(${ftsTableName}, rowid) VALUES('delete', old.rowid);
                        INSERT INTO ${ftsTableName}(rowid, ${columns})
                        VALUES (new.rowid, ${columns.split(',').map(c => `new.${c.trim()}`).join(',')});
                    END;`
                ];
                for (const sql of triggerSqls) {
                    await this.dataspace.db.exec(sql);
                }
            }

            // 提交事务
            await this.dataspace.db.exec('COMMIT');

            console.log(`FTS table ${ftsTableName} created for ${tableName}`);
        } catch (error) {
            
            // 回滚事务
            await this.dataspace.db.exec('ROLLBACK');

            // if (error.code === 'SQLITE_BUSY') {
            //     // 可以选择重试几次
            //     console.warn(`Database is busy, retrying in 1 second...`);
            //     await new Promise(resolve => setTimeout(resolve, 1000));
            //     return this.createDynamicFTS(tableName, temporary);
            // }

            throw error;
        }
    }

    async search(tableName: string, query: string, viewId: string, page: number = 1, pageSize: number = 20) {
        if (!isDesktopMode) {
            throw new Error('Full text search is not supported in web mode');
        }

        const startTime = performance.now();
        const ftsTableName = `fts_${tableName}`;
        const offset = (page - 1) * pageSize;

        try {
            const hasFTS = await this.hasFTS(tableName);
            if (!hasFTS) {
                console.log('createDynamicFTS', tableName)
                throw new Error(`FTS table ${ftsTableName} does not exist.`)
            }

            const view = await this.dataspace.view.get(viewId);
            if (!view?.query) {
                throw new Error(`View ${viewId} not found or has no query`);
            }

            const countSql = `
                SELECT COUNT(*) as total 
                FROM ${tableName} t
                JOIN ${ftsTableName} fts ON t.rowid = fts.rowid 
                WHERE ${ftsTableName} MATCH ?
            `;
            const [{ total }] = await this.dataspace.db.selectObjects(countSql, [query]);

            if (total === 0) {
                return {
                    results: [],
                    searchTime: -1,
                    totalMatches: 0,
                    currentPage: page,
                    totalPages: 0
                }
            }

            const tableInfo = await this.dataspace.db.selectObjects(`PRAGMA table_info(${tableName})`);
            const columns = tableInfo
                .map((col: any) => col.name)
                .filter((name: any) => name.toLowerCase() !== 'rowid');

            const highlightSelects = columns
                .map(col => `highlight(${ftsTableName}, ${columns.indexOf(col)}, '<mark>', '</mark>') as highlight_${col}`)
                .join(', ');

            const matchSql = `
                WITH original_view AS (
                    SELECT 
                        ${tableName}.rowid,
                        v.*,
                        ROW_NUMBER() OVER () as original_order,
                        ROW_NUMBER() OVER () - 1 as row_index
                    FROM (${view.query}) v
                    JOIN ${tableName} ON ${tableName}._id = v._id
                ),
                matched_rows AS (
                    SELECT 
                        fts.rowid,
                        ${highlightSelects}
                    FROM ${ftsTableName} fts
                    WHERE ${ftsTableName} MATCH ?
                )
                SELECT v.*, m.*
                FROM original_view v
                JOIN matched_rows m ON m.rowid = v.rowid
                ORDER BY v.original_order
                LIMIT ? OFFSET ?
            `;

            const results = await this.dataspace.db.selectObjects(
                matchSql,
                [query, pageSize, offset]
            );

            const processedResults = results.map((row: any) => {
                const matches = [];
                for (const col of columns) {
                    const highlightKey = `highlight_${col}`;
                    const highlight = row[highlightKey];

                    if (highlight && highlight.includes('<mark>')) {
                        matches.push({
                            column: col,
                            snippet: highlight
                        });
                    }
                    delete row[highlightKey];
                }

                const rowIndex = row.row_index;
                delete row.row_index;
                delete row.original_order;

                return {
                    row,
                    matches,
                    rowIndex
                };
            });

            const endTime = performance.now();
            const searchTime = Math.round(endTime - startTime);

            return {
                results: processedResults,
                searchTime,
                totalMatches: total,
                currentPage: page,
                totalPages: Math.ceil(total / pageSize)
            };
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }

    async clearFTS(tableName: string) {
        if (!isDesktopMode) {
            throw new Error('Full text search is not supported in web mode');
        }

        const ftsTableName = `fts_${tableName}`;

        try {
            const tableExists = await this.dataspace.db.selectObjects(
                `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                [ftsTableName]
            );

            if (tableExists.length === 0) {
                console.warn(`FTS table ${ftsTableName} does not exist. no need to clear`);
                return
            }

            await this.dataspace.db.exec(`INSERT INTO ${ftsTableName}(${ftsTableName}) VALUES('delete-all')`);

            await this.dataspace.db.exec('VACUUM');

            console.log(`FTS table ${ftsTableName} has been cleared`);
        } catch (error) {
            console.error(`Error clearing FTS table ${ftsTableName}:`, error);
            throw error;
        }
    }

    async dropFTS(tableName: string) {
        if (!isDesktopMode) {
            throw new Error('Full text search is not supported in web mode');
        }

        const ftsTableName = `fts_${tableName}`;

        try {
            const tableExists = await this.dataspace.db.selectObjects(
                `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                [ftsTableName]
            );

            if (tableExists.length === 0) {
                console.warn(`FTS table ${ftsTableName} does not exist. no need to drop`);
                return;
            }

            const triggerNames = [
                `fts_${tableName}_ai`,
                `fts_${tableName}_ad`,
                `fts_${tableName}_au`
            ];

            for (const triggerName of triggerNames) {
                await this.dataspace.db.exec(`DROP TRIGGER IF EXISTS ${triggerName}`);
            }

            await this.dataspace.db.exec(`DROP TABLE IF EXISTS ${ftsTableName}`);

            console.log(`FTS table ${ftsTableName} and related triggers have been dropped`);
        } catch (error) {
            console.error(`Error dropping FTS table ${ftsTableName}:`, error);
            throw error;
        }
    }

    async hasFTS(tableName: string): Promise<boolean> {
        if (!isDesktopMode) {
            throw new Error('Full text search is not supported in web mode');
        }

        const ftsTableName = `fts_${tableName}`;

        try {
            const tableExists = await this.dataspace.db.selectObjects(
                `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                [ftsTableName]
            );

            return tableExists.length > 0;
        } catch (error) {
            console.error(`Error checking FTS table ${ftsTableName}:`, error);
            throw error;
        }
    }
}