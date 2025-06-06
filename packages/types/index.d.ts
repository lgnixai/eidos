/// <reference types="react" resolution-mode="require"/>
/// <reference types="node" />
/// <reference types="node" />
declare module "packages/lib/env" {
    export const logger: Console;
    export const EIDOS_VERSION = "0.19.0";
    export const isDevMode: boolean;
    export const isSelfHosted: boolean;
    export const isInkServiceMode: boolean;
    export const isDesktopMode: boolean;
    export const isStagingMode: boolean;
}
declare module "packages/lib/mime/mime" {
    /**
     * source: https://github.com/jshttp/mime-types/blob/master/index.js
     * refactored to typescript via copilot
     * js => ts
     * path => path-browserify
     */
    /*!
     * mime-types
     * Copyright(c) 2014 Jonathan Ong
     * Copyright(c) 2015 Douglas Christopher Wilson
     * MIT Licensed
     */
    /**
     * Get the default charset for a MIME type.
     *
     * @param {string} type
     * @return {boolean|string}
     */
    export const charset: (type: string) => boolean | string;
    /**
     * Create a full Content-Type header given a MIME type or extension.
     *
     * @param {string} str
     * @return {boolean|string}
     */
    export const contentType: (str: string) => boolean | string;
    /**
     * Get the default extension for a MIME type.
     *
     * @param {string} type
     * @return {boolean|string}
     */
    export const extension: (type: string) => boolean | string;
    /**
     * Lookup the MIME type for a file path/extension.
     *
     * @param {string} path
     * @return {boolean|string}
     */
    export const lookup: (path: string) => boolean | string;
    export const extensions: {
        [key: string]: string[];
    };
    export const types: {
        [key: string]: string;
    };
    export const getFileType: (url: string) => boolean | string | "image" | "audio" | "video";
    export const getFilePreviewImage: (url: string) => string;
}
declare module "packages/lib/storage/indexeddb" {
    import { StateStorage } from "zustand/middleware";
    export const indexedDBStorage: StateStorage;
    export const getConfig: <T = Record<string, any>>(name: string) => Promise<T>;
    export const DATABASE_NAME = "eidos";
    export function getIndexedDBValue<T = any>(tableName: string, key: string): Promise<T>;
}
declare module "packages/lib/storage/eidos-file-system" {
    export enum FileSystemType {
        OPFS = "opfs",
        NFS = "nfs"
    }
    export const getFsRootHandle: (fsType: FileSystemType) => Promise<FileSystemDirectoryHandle>;
    export const getExternalFolderHandle: (name: string) => Promise<FileSystemDirectoryHandle>;
    /**
     * get DirHandle for a given path list
     * we read config from indexeddb to decide which file system to use
     * there are two file systems:
     * 1. opfs: origin private file system. store files in web.
     * 2. nfs: Native File System. store files in local file system.
     * @param _paths path list just like ["root", "dir1", "dir2"]
     * @param rootDirHandle we can pass rootDirHandle to avoid reading from indexeddb
     * @returns
     */
    export const getDirHandle: (_paths: string[], rootDirHandle?: FileSystemDirectoryHandle) => Promise<FileSystemDirectoryHandle>;
    /**
     * eidos fs structure:
     * - spaces
     *  - space1
     *    - db.sqlite3
     *    - files
     *      - 1234567890.png
     *      - 0987654321.png
     *  - space2
     *    - db.sqlite3
     *
     * spaces
     * - what is a space? a space is a folder that contains a sqlite3 database, default name is db.sqlite3.
     * - one space is one database.
     *
     * files
     * - files is a folder that contains all static files, such as images, videos, etc.
     * - when user upload a file, it will be saved in this folder. hash will be used as file name. e.g. 1234567890.png
     */
    export class EidosFileSystemManager {
        rootDirHandle: FileSystemDirectoryHandle | undefined;
        constructor(rootDirHandle?: FileSystemDirectoryHandle);
        isSameEntry: (dirHandle: FileSystemDirectoryHandle) => Promise<boolean>;
        getDirHandle: (paths: string[]) => Promise<FileSystemDirectoryHandle>;
        walk: (_paths: string[]) => Promise<string[][]>;
        copyFile: (_paths: string[], targetFs: EidosFileSystemManager) => Promise<void>;
        copyTo: (targetFs: EidosFileSystemManager, options?: {
            ignoreSqlite?: boolean;
        }, cb?: (data: {
            current: number;
            total: number;
            msg: string;
        }) => void) => Promise<void>;
        getFileUrlByPath: (path: string, replaceSpace?: string) => string;
        getFileByURL: (url: string) => Promise<File>;
        getFileByPath: (path: string) => Promise<File>;
        listDir: (_paths: string[]) => Promise<FileSystemFileHandle[]>;
        updateOrCreateDocFile: (_paths: string[], content: string) => Promise<void>;
        checkFileExists: (_paths: string[]) => Promise<boolean>;
        getFile: (_paths: string[], options?: FileSystemGetFileOptions) => Promise<File>;
        getFileText: (_paths: string[]) => Promise<string>;
        getDocContent: (_paths: string[]) => Promise<string>;
        addDir: (_paths: string[], dirName: string) => Promise<void>;
        addFile: (_paths: string[], file: File, fileId?: string) => Promise<string[]>;
        deleteEntry: (_paths: string[], isDir?: boolean) => Promise<void>;
        renameFile: (_paths: string[], newName: string) => Promise<void>;
    }
    export const efsManager: EidosFileSystemManager;
    export const getExternalFolderManager: (name: string) => Promise<EidosFileSystemManager>;
}
declare module "packages/lib/storage/zip-file" {
    import JSZip from "jszip";
    export function zipDirectory(dirPaths: string[], zip?: JSZip): Promise<JSZip>;
    export const zipFile2Blob: (file: JSZip.JSZipObject) => Promise<File>;
    export function getPackageJsonFromZipFile(file: File): Promise<any>;
    export function unZipFileToDir(file: File, rootPaths: string[]): Promise<void>;
    export function importZipFileIntoDir(rootPaths: string[], zip: JSZip): Promise<void>;
}
declare module "packages/lib/storage/space" {
    /**
     * when expose spaceFileSystem  from electron preload,
     * the method only works when it's a arrow function, i don't know why, so we need to use class to wrap it
     */
    export class SpaceFileSystem {
        rootDirHandle?: FileSystemDirectoryHandle;
        constructor(rootDirHandle?: FileSystemDirectoryHandle);
        remove: (space: string) => Promise<void>;
        /**
         * import space from .zip file
         * @param space
         * @param file
         */
        import: (space: string, file: File) => Promise<void>;
        create: (space: string) => Promise<FileSystemDirectoryHandle>;
        export: (space: string) => Promise<void>;
        /**
         *
         * @returns list of spaces
         */
        list: () => Promise<any[]>;
        getSpaceInfo: (space: string) => Promise<{
            isSyncEnabled: boolean;
            graftId?: undefined;
        } | {
            isSyncEnabled: boolean;
            graftId: string;
        }>;
    }
}
declare module "packages/lib/const" {
    export enum MsgType {
        SetConfig = "SetConfig",
        CallFunction = "CallFunction",
        SwitchDatabase = "SwitchDatabase",
        CreateSpace = "CreateSpace",
        Syscall = "Syscall",
        Status = "Status",
        Pull = "Pull",
        Push = "Push",
        Reset = "Reset",
        Pages = "Pages",
        Error = "Error",
        QueryResp = "QueryResp",
        Notify = "Notify",
        BlockUIMsg = "BlockUIMsg",
        DataUpdateSignal = "DataUpdateSignal",
        WebSocketConnected = "WebSocketConnected",
        WebSocketDisconnected = "WebSocketDisconnected",
        ConvertMarkdown2State = "ConvertMarkdown2State",
        ConvertHtml2State = "ConvertHtml2State",
        ConvertEmail2State = "ConvertEmail2State",
        GetDocMarkdown = "GetDocMarkdown",
        HighlightRow = "HighlightRow"
    }
    export enum MainServiceWorkerMsgType {
        SetData = "SetData"
    }
    export enum EidosDataEventChannelMsgType {
        DataUpdateSignalType = "DataUpdateSignalType",
        MetaTableUpdateSignalType = "MetaTableUpdateSignalType"
    }
    export type EidosDataEventChannelMsg = {
        type: EidosDataEventChannelMsgType;
        payload: {
            type: DataUpdateSignalType;
            table: string;
            _new: Record<string, any> & {
                _id: string;
            };
            _old: Record<string, any> & {
                _id: string;
            };
        };
    };
    export enum DataUpdateSignalType {
        Update = "update",
        Insert = "insert",
        Delete = "delete",
        AddColumn = "addColumn",
        UpdateColumn = "updateColumn"
    }
    export const EidosDataEventChannelName = "eidos-data-event";
    export const EidosSharedEnvChannelName = "eidos-shared-env";
    export const EidosMessageChannelName = "eidos-message";
    export const EidosProtocolUrlChannelName = "eidos-protocol-url";
    export const DOMAINS: {
        HOME: string;
        IMAGE_PROXY: string;
        LINK_PREVIEW: string;
        WIKI: string;
        DOWNLOAD: string;
        ACTIVATION_SERVER: string;
        EXTENSION_SERVER: string;
        API_AGENT_SERVER: string;
        DISCORD_INVITE: string;
        GITHUB_ISSUES: string;
        GEOLOCATION_API: string;
        ACCOUNT_REGISTRATION: string;
    };
    export enum CustomEventType {
        UpdateColumn = "eidos-update-column"
    }
    export const EIDOS_SPACE_BASE_URL: string;
    export const EIDOS_CHAT_PROJECT_ID = "EIDOS_CHAT";
}
declare module "packages/lib/fields/const" {
    export enum FieldType {
        Number = "number",
        Text = "text",
        Title = "title",
        Checkbox = "checkbox",
        Date = "date",
        File = "file",
        MultiSelect = "multi-select",
        Rating = "rating",
        Select = "select",
        URL = "url",
        Formula = "formula",
        Link = "link",
        Lookup = "lookup",
        CreatedTime = "created-time",
        CreatedBy = "created-by",
        LastEditedTime = "last-edited-time",
        LastEditedBy = "last-edited-by"
    }
    export enum FieldValueType {
        String = "string",
        Number = "number",
        Boolean = "boolean"
    }
    export const FIELD_VALUE_TYPE_MAP: {
        title: {
            valueType: FieldValueType;
            example: string;
        };
        text: {
            valueType: FieldValueType;
            example: string;
        };
        number: {
            valueType: FieldValueType;
            example: number;
        };
        checkbox: {
            valueType: FieldValueType;
            example: boolean;
        };
        date: {
            valueType: FieldValueType;
            example: string;
        };
        file: {
            valueType: FieldValueType;
            example: string;
        };
        "multi-select": {
            valueType: FieldValueType;
            example: string;
        };
        rating: {
            valueType: FieldValueType;
            example: number;
        };
        select: {
            valueType: FieldValueType;
            example: string;
        };
        url: {
            valueType: FieldValueType;
            example: string;
        };
        formula: {
            valueType: FieldValueType;
            example: string;
        };
        link: {
            valueType: FieldValueType;
            example: string;
        };
        lookup: {
            valueType: FieldValueType;
            example: string;
        };
        "created-time": {
            valueType: FieldValueType;
            example: string;
        };
        "created-by": {
            valueType: FieldValueType;
            example: string;
        };
        "last-edited-time": {
            valueType: FieldValueType;
            example: string;
        };
        "last-edited-by": {
            valueType: FieldValueType;
            example: string;
        };
    };
    export enum GridCellKind {
        Uri = "uri",
        Text = "text",
        Image = "image",
        RowID = "row-id",
        Number = "number",
        Bubble = "bubble",
        Boolean = "boolean",
        Loading = "loading",
        Markdown = "markdown",
        Drilldown = "drilldown",
        Protected = "protected",
        Custom = "custom"
    }
    export enum CompareOperator {
        IsEmpty = "IsEmpty",
        IsNotEmpty = "IsNotEmpty",
        Equal = "=",
        NotEqual = "!=",
        Contains = "Contains",
        NotContains = "NotContains",
        StartsWith = "StartsWith",
        EndsWith = "EndsWith",
        GreaterThan = ">",
        GreaterThanOrEqual = ">=",
        LessThan = "<",
        LessThanOrEqual = "<="
    }
    export enum BinaryOperator {
        And = "AND",
        Or = "OR"
    }
    export const NUMBER_BASED_COMPARE_OPERATORS: CompareOperator[];
    export const TEXT_BASED_COMPARE_OPERATORS: CompareOperator[];
    export function applyMixins(derivedCtor: any, constructors: any[]): void;
}
declare module "packages/lib/sqlite/const" {
    /**
     * define constance what we will use in sqlite
     */
    export const TreeTableName = "eidos__tree";
    export const ColumnTableName = "eidos__columns";
    export const TodoTableName = "eidos__todo";
    export const FileTableName = "eidos__files";
    export const DocTableName = "eidos__docs";
    export const ActionTableName = "eidos__actions";
    export const ScriptTableName = "eidos__scripts";
    export const ViewTableName = "eidos__views";
    export const EmbeddingTableName = "eidos__embeddings";
    export const ReferenceTableName = "eidos__references";
    export const ChatTableName = "eidos__chats";
    export const MessageTableName = "eidos__messages";
    export const QueueTableName = "eidos__queue";
    export const ExtNodeTableName = "eidos__extnodes";
}
declare module "packages/lib/store/ITreeNode" {
    export interface ITreeNode {
        id: string;
        name: string;
        type: "table" | "doc" | "folder" | string;
        position?: number;
        parent_id?: string;
        is_pinned?: boolean;
        is_full_width?: boolean;
        is_locked?: boolean;
        is_deleted?: boolean;
        hide_properties?: boolean;
        icon?: string;
        cover?: string;
        created_at?: string;
        updated_at?: string;
    }
}
declare module "packages/lib/store/IView" {
    import { FilterValueType } from "components/table/view-filter-editor/interface";
    export enum ViewTypeEnum {
        Grid = "grid",
        Gallery = "gallery",
        DocList = "doc_list",
        Kanban = "kanban"
    }
    export interface IView<T = any> {
        id: string;
        name: string;
        type: ViewTypeEnum;
        table_id: string;
        query: string;
        fieldIds?: string[];
        properties?: T;
        filter?: FilterValueType;
        order_map?: Record<string, number>;
        hidden_fields?: string[];
        position?: number;
    }
    export interface IGridViewProperties {
        fieldWidthMap: Record<string, number>;
        freezeColumns?: number;
    }
}
declare module "packages/lib/store/interface" {
    import { FieldType } from "packages/lib/fields/const";
    import { ITreeNode } from "packages/lib/store/ITreeNode";
    import { IView } from "packages/lib/store/IView";
    export type IField<T = any> = {
        name: string;
        type: FieldType;
        table_column_name: string;
        table_name: string;
        property: T;
        created_at?: string;
        updated_at?: string;
    };
    export interface ITable {
        rowMap: {
            [rowId: string]: Record<string, any>;
        };
        fieldMap: {
            [fieldId: string]: IField;
        };
        viewMap: {
            [viewId: string]: IView;
        };
        viewIds: string[];
    }
    export interface IDataStore {
        tableMap: {
            [nodeId: string]: ITable;
        };
        nodeIds: string[];
        nodeMap: {
            [nodeId: string]: ITreeNode;
        };
    }
}
declare module "packages/lib/sqlite/helper" {
    export const getTransformedQuery: (query: string) => string;
    export function isReadOnlySql(sql: string): boolean;
    /**
     *
     * example 1:
     *
     * const id = 42
     * const fieldName = "id"
     * buildSql`select ${Symbol(fieldName)} from table where id = ${id}` => { sql: "select id from table where id = ?", bind: [42]}
     *
     * example 2:
     * const table = "books"
     * buildSql`select * from ${Symbol(table)}` => { sql: "select * from books", bind: []}
     *
     * buildSql only return sql and bind, no execute.we need to escape table name, column name, etc.
     *
     * in example 1, we can use ? placeholder to avoid sql injection
     * in example 2, we need to escape table name, column name, etc.
     *
     * if variable is a Symbol, we don't escape it.
     * @param strings
     * @param values
     * @returns
     */
    export function buildSql(strings: TemplateStringsArray, ...values: any[]): {
        sql: string;
        bind: any[];
    };
    export const checkSqlIsModifyTableSchema: (sql: string) => boolean;
    export const checkSqlIsOnlyQuery: (sql: string) => boolean;
    export const checkSqlIsModifyTableData: (sql: string) => boolean;
    export function isAggregated(sql: string): boolean;
    export const aggregateSql2columns: (sql: string, originFields: string[]) => any;
    export const getSqlQueryColumns: (sql: string, originSchema: any) => any;
    export const queryData2JSON: (sqlResult: any[][], fields: string[]) => any[];
    export const stringify: (obj: any) => any;
}
declare module "packages/lib/utils" {
    import { type ClassValue } from "clsx";
    import type { Message } from 'ai';
    export { uuidv7 } from "uuidv7";
    export function cn(...inputs: ClassValue[]): string;
    export function sanitizeUIMessages(messages: Array<Message>): Array<Message>;
    export function getMessageIdFromAnnotations(message: Message): any;
    export const isUuidv4: (id: string) => boolean;
    export const isUuid: (id: string) => boolean;
    export function nonNullable<T>(value: T): value is NonNullable<T>;
    export const hashText: (text: string) => number;
    export const checkIsInWorker: () => boolean;
    /**
     * pathname = /space1/5c5bf8539ee9434aa721560c89f34ed6
     * databaseName = space1
     * tableId = 5c5bf8539ee9434aa721560c89f34ed6
     * tableName = user custom name
     * rawTableName = tb_5c5bf8539ee9434aa721560c89f34ed6 (real table name in sqlite)
     * @param id
     * @returns
     */
    export const getRawTableNameById: (id: string) => string;
    export const getTableIdByRawTableName: (rawTableName: string) => string;
    export const getColumnIndexName: (tableName: string, columnName: string) => string;
    export const generateColumnName: () => string;
    export const getRawDocNameById: (id: string) => string;
    export const shortenId: (id: string) => string;
    export const extractIdFromShortId: (shortId: string) => string;
    export const getDate: (offset: number, baseDate?: Date | string) => string;
    export const getToday: () => string;
    export const getYesterday: () => string;
    export const getTomorrow: () => string;
    /**
     *
     * @param str yyyy-w[week]
     */
    export const isWeekNodeId: (str?: string) => boolean;
    /**
     * get week of the year
     * @param day  yyyy-mm-dd || yyyy-w[week]
     * @returns
     */
    export const getWeek: (day: string) => number;
    /**
     *
     * @param weekNodeId yyyy-w[week]
     * @returns
     */
    export const getDaysByYearWeek: (weekNodeId: string) => any[];
    export const getLocalDate: (date: Date) => string;
    export const getUuid: () => string;
    export const generateId: () => string;
    export const isDayPageId: (id: string | undefined) => boolean;
    /**
     * Returns a string representing the time elapsed since the given date.
     * @param date - The date to calculate the time elapsed from.
     * @returns A string representing the time elapsed in a human-readable format.
     */
    export function timeAgo(date: Date): string;
    export const proxyURL: (url?: string) => string;
    export const getBlockUrl: (blockId: string, props?: Record<string, any>) => string;
    export const getBlockIdFromUrl: (url: string) => string;
    export const getBlockUrlWithParams: (id: string, params: Record<string, any>) => string;
    export const isStandaloneBlocksPath: (pathname: string) => boolean;
    export const isExtensionURL: (url: string) => boolean;
    /**
     *
     * @param url http://287c3686-f1e1-4b10-965e-2daa35a422fc.ext.25-w19.eidos.localhost:13127
     * return {
     *  id: '287c3686-f1e1-4b10-965e-2daa35a422fc',
     *  space: '25-w19',
     * }
     */
    export const getInfoFromExtensionUrl: (url: string) => {
        id: string;
        space: string;
    };
    export const getExtensionUrl: (id: string, space: string, searchParams?: Record<string, string>) => string;
    export const isFilesPath: (pathname: string) => boolean;
    export const fetcher: (url: string) => Promise<any>;
    export const serializePropsToUrl: (props: Record<string, any>, url: string) => string;
}
declare module "packages/lib/sqlite/sql-formula-parser" {
    import { IField } from "packages/lib/store/interface";
    export const getTableNameFromSql: (sql: string) => string;
    /**
     * example:
     * sql: select * from table1
     * fields: [{name: "id", type: "number"}, {name: "name", type: "string"}]
     * return: select id, name from table1
     *
     * example2:
     * sql: select id,name from table1
     * fields: [{name: "id", type: "number","table_column_name": "cl_xxx1"}, {name: "name", type: "string"},"table_column_name": "cl_xxx2"]
     * return: select cl_xxx1 as id, cl_xxx2 as name from table1
     * @param sql
     * @param fields
     */
    export const transformQuery: (sql: string, fields: IField[]) => string;
    export const transformFormula2VirtualGeneratedField: (columnName: string, fields: IField[]) => string;
    export const transformQueryWithFormulaFields2Sql: (query: string, fields: IField[]) => string;
    /**
     * Detects circular dependencies among generated columns
     * @param fields List of fields to check for circular dependencies
     * @returns Object with result and cycle information if found
     */
    export const detectCircularDependencies: (fields: IField[]) => {
        hasCycle: boolean;
        cycle: string[];
        dependencyGraph: Record<string, string[]>;
    };
    /**
     * Finds all formula fields that depend on a given column
     * @param columnName The column name to check dependencies for
     * @param fields List of all fields
     * @returns Array of dependent field names
     */
    export const findDependentFormulaFields: (columnName: string, fields: IField[]) => {
        columnName: string;
        fieldName: string;
    }[];
    /**
     * Gets the order in which formula fields should be deleted to respect dependencies
     * @param columnNames Array of column names to delete
     * @param fields List of all fields
     * @returns Ordered array of column names for deletion
     */
    export const getFormulaFieldDeletionOrder: (columnNames: string[], fields: IField[]) => string[];
}
declare module "packages/lib/sqlite/interface" {
    import { MsgType } from "packages/lib/const";
    export type IQuery = {
        type: MsgType.CallFunction;
        data: {
            method: string;
            params: [string, string[]];
            dbName: string;
            userId: string;
        };
        id: string;
    };
    export type IQueryResp = {
        id: string;
        data: {
            result: any;
        };
        type: MsgType.QueryResp;
    };
    export type ITreeItem = {
        id: string;
        name: string;
        type: "table" | "doc";
    };
    export interface ISqlite<T, D> {
        connector: T;
        send: (data: D) => void | Promise<any>;
        onCallBack: (thisCallId: string) => Promise<any>;
    }
    export abstract class BaseServerDatabase {
        filename?: string;
        get isWalMode(): boolean;
        pages(): Promise<{
            [key: string]: any;
        }>;
        status(): Promise<{
            [key: string]: any;
        }>;
        pull(): Promise<{
            [key: string]: any;
        }>;
        push(): Promise<{
            [key: string]: any;
        }>;
        reset(): Promise<{
            [key: string]: any;
        }>;
        abstract prepare(sql: string): {
            run: (bind?: any[]) => void;
        };
        abstract close(): void;
        abstract selectObjects(sql: string, bind?: any[]): Promise<{
            [columnName: string]: any;
        }[]>;
        abstract transaction(func: (db: BaseServerDatabase) => void): any;
        abstract exec(opts: string | {
            sql: string;
            bind?: any[];
            rowMode?: "array" | "object";
            returnValue?: "resultRows" | "saveSql";
        }): Promise<any>;
        abstract createFunction(opt: {
            name: string;
            xFunc: (...args: any[]) => any;
        }): any;
    }
}
declare module "packages/lib/sqlite/sql-merge-table-with-new-columns" {
    /**
     * sqlite has some limitations on alter table, for example, we can't add a column with non-constant default value.
     * when we want to add new columns to a table
     * 1. we need to create a new table with new columns
     * 2. copy data from old table to new table
     * 3. then drop old table
     * 4. rename new table to old table name.
     * @param createTableSql
     * @param newColumnSql
     */
    export function generateMergeTableWithNewColumnsSql(createTableSql: string, newColumnSql: string): {
        newTmpTableSql: string;
        sql: string;
    };
}
declare module "packages/worker/web-worker/sdk/index-manager" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    import { TableManager } from "packages/worker/web-worker/sdk/table";
    export class IndexManager {
        private table;
        dataSpace: DataSpace;
        tableManager: TableManager;
        constructor(table: TableManager);
        createIndex(column: string, onStart?: () => void, onEnd?: () => void): Promise<void>;
    }
}
declare module "packages/lib/fields/base" {
    import { IField } from "packages/lib/store/interface";
    import { CompareOperator, FieldType } from "packages/lib/fields/const";
    interface IBaseField<CD, P, R, RC, FC> {
        /**
         * column from eidos__columns table, guild how to render this field
         */
        column: IField<P>;
        context: FC | undefined;
        get entityFieldInstance(): BaseField<any, any, any, any, any> | null;
        /**
         * define the compare operators for this field, will be used in the filter
         */
        compareOperators: string[];
        /**
         * for render cell, for grid view
         * @param rawData raw data stored in the database
         * @param context some field need context to render, like user field need user map. we only store the user id in the database
         */
        getCellContent(rawData: any, context?: RC): CD;
        /**
         * we store the raw data in the database, but we need to transform the raw data into json for other usage which make it more readable
         * eg: API, SDK, Script etc
         * {
         *  title: "this is title",
         *  cl_xxx: "field1 value",
         *  cl_yyy: "field2 value",
         * } => {
         *  title: "this is title",
         *  field1: "field1 value",
         *  field2: "field2 value",
         * }
         * @param rawData data stored in the database, most of the time, it's a string
         */
        rawData2JSON(rawData: R): any;
        /**
         * transform the cell data into raw data, which can be stored in the database
         * @param cell cell data, which is the return value of getCellContent
         */
        cellData2RawData(cell: CD): any;
    }
    export abstract class BaseField<CD, P, R = string, RC = any, FC = any> implements IBaseField<CD, P, R, RC, FC> {
        static type: FieldType;
        /**
         * each table column has a corresponding ui column, which stored in the `${ColumnTableName}` table
         * we use the ui column to store the column's display name, type, and other ui related information
         * different field will have different property
         */
        column: IField<P>;
        context: FC | undefined;
        constructor(column: IField<P>, context?: FC);
        get entityFieldInstance(): BaseField<any, any, any, any, any> | null;
        get displayType(): FieldType;
        get isTransformable(): boolean;
        abstract get compareOperators(): CompareOperator[];
        /**
         * getCellContent will be called when the cell is rendered
         * transform the raw data into the cell content for rendering
         * @param rawData this is the raw data stored in the database
         */
        abstract getCellContent(rawData: any, context?: RC): CD;
        abstract rawData2JSON(rawData: R): any;
        abstract cellData2RawData(cell: CD): {
            rawData: any;
            shouldUpdateFieldProperty?: boolean;
        };
        /**
         * every field should have a property, when you create a new field, you should implement this method
         * @returns
         */
        static getDefaultFieldProperty(): {};
        text2RawData(text: string | number | string[] | Date): string | number | boolean | null;
    }
}
declare module "packages/lib/fields/checkbox" {
    import type { BooleanCell } from "@glideapps/glide-data-grid";
    import { BaseField } from "packages/lib/fields/base";
    import { CompareOperator, FieldType } from "packages/lib/fields/const";
    type CheckboxProperty = {};
    type CheckboxCell = BooleanCell;
    export class CheckboxField extends BaseField<CheckboxCell, CheckboxProperty, number> {
        static type: FieldType;
        get compareOperators(): CompareOperator[];
        rawData2JSON(rawData: number): number;
        getCellContent(rawData: number | undefined): CheckboxCell;
        text2RawData(value: string | number): true;
        cellData2RawData(cell: CheckboxCell): {
            rawData: number;
        };
    }
}
declare module "packages/lib/fields/created-by" {
    import type { UserProfileCell } from "components/table/views/grid/cells/user-profile-cell";
    import { BaseField } from "packages/lib/fields/base";
    import { CompareOperator, FieldType } from "packages/lib/fields/const";
    type CreatedByProperty = {};
    export type UserFieldContext = {
        userMap?: {
            [id: string]: {
                name: string;
                avatar?: string;
            };
        };
    };
    export class CreatedByField extends BaseField<UserProfileCell, CreatedByProperty, string, UserFieldContext> {
        static type: FieldType;
        rawData2JSON(rawData: string): string;
        get compareOperators(): CompareOperator[];
        getCellContent(rawData: string | undefined, context?: UserFieldContext): UserProfileCell;
        cellData2RawData(cell: UserProfileCell): {
            rawData: import("@/components/table/views/grid/cells/user-profile-cell").UserProfileCellProps;
        };
    }
}
declare module "packages/lib/fields/created-time" {
    import { TextCell } from "@glideapps/glide-data-grid";
    import { BaseField } from "packages/lib/fields/base";
    import { CompareOperator, FieldType } from "packages/lib/fields/const";
    type DateProperty = {};
    export class CreatedTimeField extends BaseField<TextCell, DateProperty, string> {
        static type: FieldType;
        rawData2JSON(rawData: string): string;
        get compareOperators(): CompareOperator[];
        getCellContent(rawData: string | undefined): TextCell;
        cellData2RawData(cell: TextCell): {
            rawData: string;
        };
    }
}
declare module "packages/lib/fields/date" {
    import type { DatePickerCell } from "components/table/views/grid/cells/date-picker-cell";
    import { BaseField } from "packages/lib/fields/base";
    import { CompareOperator, FieldType } from "packages/lib/fields/const";
    type DateProperty = {};
    type DateCell = DatePickerCell;
    export class DateField extends BaseField<DateCell, DateProperty, string> {
        static type: FieldType;
        rawData2JSON(rawData: string): string;
        get compareOperators(): CompareOperator[];
        getCellContent(rawData: string | undefined): DateCell;
        cellData2RawData(cell: DateCell): {
            rawData: string;
        };
    }
}
declare module "packages/worker/web-worker/meta-table/base" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    export interface MetaTable<T> {
        add(data: T): Promise<T>;
        get(id: string): Promise<T | null>;
        set(id: string, data: Partial<T>): Promise<boolean>;
        del(id: string): Promise<boolean>;
    }
    export interface BaseTable<T> extends MetaTable<T> {
        name: string;
        createTableSql: string;
        JSONFields?: string[];
    }
    export class BaseTableImpl<T = any> {
        protected dataSpace: DataSpace;
        name: string;
        JSONFields: string[];
        constructor(dataSpace: DataSpace);
        initTable(createTableSql: string): void;
        toJson: (data: T) => T;
        del(id: string, db?: import("@/lib/sqlite/interface").BaseServerDatabase): Promise<boolean>;
        delBy(data: Partial<T>, db?: import("@/lib/sqlite/interface").BaseServerDatabase): Promise<boolean>;
        get(id: string): Promise<T | null>;
        transformData: (data: Partial<T>) => {
            kv: any[][];
            updateKPlaceholder: string;
            insertKPlaceholder: string;
            insertVPlaceholder: string;
            deleteKPlaceholder: string;
            values: any[];
        };
        add(data: Partial<T>, db?: import("@/lib/sqlite/interface").BaseServerDatabase): Promise<T>;
        set(id: string, data: Partial<T>): Promise<boolean>;
        list(query?: Partial<T>, opts?: {
            limit?: number;
            offset?: number;
            orderBy?: string;
            order?: "ASC" | "DESC";
            fields?: string[];
        }): Promise<T[]>;
    }
}
declare module "packages/worker/web-worker/meta-table/file" {
    import { FileSystemType } from "packages/lib/storage/eidos-file-system";
    import { BaseTable, BaseTableImpl } from "packages/worker/web-worker/meta-table/base";
    export interface IFile {
        id: string;
        name: string;
        path: string;
        size: number;
        mime: string;
        created_at?: string;
        is_vectorized?: boolean;
    }
    export class FileTable extends BaseTableImpl implements BaseTable<IFile> {
        name: string;
        createTableSql: string;
        /**
         * save file to efs
         * @param url a url of file
         * @param subDir sub directory of file, default is [], which means save file to spaces/\<space\>/files/, if subDir is ["a","b"], then save file to spaces/\<space\>/files/a/b/
         * @param _name file name, default is null, which means use the file name in url
         * @returns
         */
        saveFile2EFS(url: string, subDir: string[], _name?: string): Promise<IFile | null>;
        add(data: IFile): Promise<IFile>;
        getFileByPath(path: string): Promise<IFile | null>;
        deleteFileByPathPrefix(prefix: string): Promise<boolean>;
        updateVectorized(id: string, is_vectorized: boolean): Promise<boolean>;
        get(id: string): Promise<IFile | null>;
        del(id: string): Promise<boolean>;
        /**
         * get blob url of file
         * in script or extension environment we can't access opfs file directly, so we need to use blob url to access it.
         * @param id file id
         * @returns
         */
        getBlobURL(id: string): Promise<string | null>;
        getBlobURLbyPath(path: string): Promise<string | null>;
        getBlobByPath(path: string): Promise<Blob>;
        walk(): Promise<any[]>;
        transformFileSystem(sourceFs: FileSystemType, targetFs: FileSystemType): Promise<void>;
        uploadDir(dirHandle: FileSystemDirectoryHandle, total: number, current: number, _parentPath?: string[]): Promise<void>;
        /**
         * Upload a file to EFS with specified parent path
         * @param fileData File data as ArrayBuffer or base64 string
         * @param fileName Original file name
         * @param mimeType File mime type
         * @param parentPath Parent path array, defaults to ["spaces", <space>, "files"]
         * @returns Uploaded file info
         */
        upload(fileData: ArrayBuffer | string, // ArrayBuffer or base64 string
        fileName: string, mimeType: string, parentPath?: string[]): Promise<IFile & {
            publicUrl: string;
        }>;
    }
}
declare module "packages/lib/sqlite/sql-meta-table-trigger" {
    /**
     * SQL Meta Table Trigger Generator
     *
     * Provides utility functions to generate standardized triggers for meta tables
     * that emit events for INSERT and UPDATE operations.
     */
    export interface TriggerField {
        name: string;
        type?: 'TEXT' | 'INTEGER' | 'REAL' | 'BOOLEAN' | 'TIMESTAMP';
    }
    export type TriggerOperation = 'insert' | 'update' | 'both';
    export interface TriggerOptions {
        tableName: string;
        fields: TriggerField[];
        /**
         * Which operations to generate triggers for (default: 'both')
         */
        operations?: TriggerOperation;
        /**
         * Custom trigger name suffix, defaults to standard naming
         */
        triggerSuffix?: {
            insert?: string;
            update?: string;
        };
        /**
         * Whether to create temporary triggers (default: true)
         */
        temporary?: boolean;
        /**
         * Custom event function names
         */
        eventFunctions?: {
            insert?: string;
            update?: string;
        };
    }
    /**
     * Generate INSERT trigger SQL
     */
    export function generateInsertTrigger(options: TriggerOptions): string;
    /**
     * Generate UPDATE trigger SQL
     */
    export function generateUpdateTrigger(options: TriggerOptions): string;
    /**
     * Generate both INSERT and UPDATE triggers
     */
    export function generateMetaTableTriggers(options: TriggerOptions): string;
    /**
     * Convenience function to create triggers with field names only
     */
    export function createTriggersForFields(tableName: string, fieldNames: string[], operations?: TriggerOperation): string;
    /**
     * Convenience function to create only INSERT trigger
     */
    export function createInsertTriggerForFields(tableName: string, fieldNames: string[]): string;
    /**
     * Convenience function to create only UPDATE trigger
     */
    export function createUpdateTriggerForFields(tableName: string, fieldNames: string[]): string;
}
declare module "packages/worker/web-worker/meta-table/extension" {
    import { JsonSchema7ObjectType } from "zod-to-json-schema";
    import { BaseTable, BaseTableImpl } from "packages/worker/web-worker/meta-table/base";
    export type ExtensionStatus = "all" | "enabled" | "disabled";
    export interface ICommand {
        name: string;
        description: string;
        inputJSONSchema?: JsonSchema7ObjectType;
        outputJSONSchema?: JsonSchema7ObjectType;
        asTableAction?: boolean;
        asTool?: boolean;
    }
    export interface IPromptConfig {
        model?: string;
        actions?: string[];
    }
    export interface IExtension {
        id: string;
        name: string;
        type: "script" | "udf" | "prompt" | "block" | "app" | "m_block" | "doc_plugin" | "py_script" | "ext_node";
        ext_node_type?: string;
        ext_node_handle_block_id?: string;
        description: string;
        version: string;
        code: string;
        icon?: string;
        marketplace_id?: string;
        ts_code?: string;
        enabled?: boolean;
        model?: string;
        prompt_config?: IPromptConfig;
        commands: ICommand[];
        tables?: {
            name: string;
            fields: {
                name: string;
                type: string;
            }[];
        }[];
        envs?: {
            name: string;
            type: string;
            readonly?: boolean;
        }[];
        env_map?: {
            [key: string]: string;
        };
        fields_map?: {
            [tableName: string]: {
                id: string;
                name: string;
                fieldsMap: {
                    [fieldName: string]: string;
                };
            };
        };
        bindings?: Record<string, {
            type: 'table';
            value: string;
        }>;
        dependencies?: string[];
    }
    export class ExtensionTable extends BaseTableImpl<IExtension> implements BaseTable<IExtension> {
        name: string;
        createTableSql: string;
        JSONFields: string[];
        del(id: string): Promise<boolean>;
        enable(id: string): Promise<boolean>;
        disable(id: string): Promise<boolean>;
        updateEnvMap(id: string, env_map: {
            [key: string]: string;
        }): Promise<boolean>;
    }
}
declare module "packages/lib/store/runtime-store" {
    /**
     * state store for runtime, for cross component communication
     */
    import { IFile } from "packages/worker/web-worker/meta-table/file";
    interface AppRuntimeState {
        isCmdkOpen: boolean;
        setCmdkOpen: (isCmdkOpen: boolean) => void;
        isKeyboardShortcutsOpen: boolean;
        setKeyboardShortcutsOpen: (isKeyboardShortcutsOpen: boolean) => void;
        isShareMode: boolean;
        setShareMode: (isShareMode: boolean) => void;
        isEmbeddingModeLoaded: boolean;
        setEmbeddingModeLoaded: (isEmbeddingModeLoaded: boolean) => void;
        currentPreviewFile: IFile | null;
        setCurrentPreviewFile: (currentPreviewFile: IFile) => void;
        isWebsocketConnected: boolean;
        setWebsocketConnected: (isWebsocketConnected: boolean) => void;
        disableDocAIComplete: boolean;
        setDisableDocAIComplete: (disableDocAIComplete: boolean) => void;
        isCompleteLoading: boolean;
        setCompleteLoading: (isCompleteLoading: boolean) => void;
        scriptContainerRef: React.RefObject<any> | null;
        setScriptContainerRef: (scriptContainerRef: React.RefObject<any>) => void;
        blockUIMsg: string | null;
        blockUIData?: Record<string, any>;
        setBlockUIMsg: (blockUIMsg: string | null) => void;
        setBlockUIData: (blockUIData: Record<string, any>) => void;
        runningCommand: string | null;
        setRunningCommand: (runningCommand: string | null) => void;
    }
    export const useAppRuntimeStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AppRuntimeState>>;
}
declare module "packages/lib/v3/cache" {
    function generateCacheKey(code: string): string;
    function hasCache(key: string): boolean;
    function getCache(key: string): any;
    function setCache(key: string, compiledCode: any): void;
    function clearExpiredCache(): void;
    export { generateCacheKey, hasCache, getCache, setCache, clearExpiredCache };
}
declare module "packages/lib/v3/esbuild" {
    export const initializeCompiler: () => Promise<void>;
    export const transform: (input: string | Uint8Array, options?: import("esbuild-wasm").SameShape<import("esbuild-wasm").TransformOptions, import("esbuild-wasm").TransformOptions>) => Promise<import("esbuild-wasm").TransformResult<import("esbuild-wasm").TransformOptions>>;
}
declare module "packages/lib/v3/compiler" {
    interface CompileOptions {
        uiLibCode?: string;
    }
    interface CompileResult {
        code: string;
        error: string | null;
    }
    export const compileCode: (sourceCode: string, options?: CompileOptions) => Promise<CompileResult>;
    export function getImportsFromCode(code: string): any[];
    export function generateImportMap(thirdPartyLibs: string[], uiLibs: string[]): Promise<{
        importMap: string;
        cleanup: () => void;
    }>;
    export function getAllLibs(code: string, processedComponents?: Set<string>): {
        thirdPartyLibs: any[];
        uiLibs: any[];
    };
}
declare module "packages/lib/python/worker" {
    export const getPythonWorker: () => Worker;
}
declare module "packages/lib/store/theme-store" {
    export interface CustomTheme {
        name: string;
        css: string;
    }
    interface ThemeState {
        currentThemeName: string;
        customThemes: CustomTheme[];
        setCurrentThemeName: (name: string) => void;
        addCustomTheme: (theme: CustomTheme) => void;
        removeCustomTheme: (name: string) => void;
        getCustomTheme: (name: string) => CustomTheme | undefined;
    }
    export const useThemeStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<ThemeState>, "persist"> & {
        persist: {
            setOptions: (options: Partial<import("zustand/middleware").PersistOptions<ThemeState, ThemeState>>) => void;
            clearStorage: () => void;
            rehydrate: () => void | Promise<void>;
            hasHydrated: () => boolean;
            onHydrate: (fn: (state: ThemeState) => void) => () => void;
            onFinishHydration: (fn: (state: ThemeState) => void) => () => void;
            getOptions: () => Partial<import("zustand/middleware").PersistOptions<ThemeState, ThemeState>>;
        };
    }>;
}
declare module "packages/lib/web/theme" {
    export type ThemeVariables = {
        background: string;
        foreground: string;
        muted: string;
        'muted-foreground': string;
        popover: string;
        'popover-foreground': string;
        border: string;
        input: string;
        card: string;
        'card-foreground': string;
        primary: string;
        'primary-foreground': string;
        secondary: string;
        'secondary-foreground': string;
        accent: string;
        'accent-foreground': string;
        destructive: string;
        'destructive-foreground': string;
        ring: string;
        radius: string;
        [key: string]: string;
    };
    export type ExtendedThemeVariables = ThemeVariables & {
        'chart-1': string;
        'chart-2': string;
        'chart-3': string;
        'chart-4': string;
        'chart-5': string;
        'sidebar': string;
        'sidebar-foreground': string;
        'sidebar-primary': string;
        'sidebar-primary-foreground': string;
        'sidebar-accent': string;
        'sidebar-accent-foreground': string;
        'sidebar-border': string;
        'sidebar-ring': string;
        'font-sans': string;
        'font-serif': string;
        'font-mono': string;
        'shadow-2xs': string;
        'shadow-xs': string;
        'shadow-sm': string;
        'shadow': string;
        'shadow-md': string;
        'shadow-lg': string;
        'shadow-xl': string;
        'shadow-2xl': string;
        'tracking-normal': string;
    };
    /**
     * Set a single CSS variable in :root
     * @param name CSS variable name (without -- prefix)
     * @param value CSS variable value
     */
    export function setCSSVariable(name: string, value: string): void;
    /**
     * Set multiple CSS variables at once
     * @param variables Object containing variable names and values
     */
    export function setThemeVariables(variables: Partial<ThemeVariables>): void;
    /**
     * Get the current value of a CSS variable
     * @param name CSS variable name (without -- prefix)
     * @returns The current value of the CSS variable
     */
    export function getCSSVariable(name: string): string;
    /**
     * Get all current theme variables
     * @returns Object containing all theme variables and their values
     */
    export function getAllThemeVariables(): ThemeVariables;
    export const defaultTheme: ThemeVariables;
    /**
     * Parse and set CSS variables from a theme configuration
     * @param theme Theme configuration object
     * @param selector CSS selector to apply the theme to (default: ':root')
     */
    export function setThemeConfig(theme: Partial<ExtendedThemeVariables>, selector?: string): void;
    export function parseCSSVariables(css: string): Record<string, string>;
    export const getThemeVariables: (rawCss: string, isDarkMode: boolean) => Record<string, string>;
}
declare module "packages/lib/types/aggregate-item" {
    export interface AggregateItem {
        column: string;
        function: "sum" | "avg" | "count" | "min" | "max" | "count_distinct";
        alias?: string;
    }
}
declare module "packages/lib/sqlite/sql-aggregate-parser" {
    import { AggregateItem } from "packages/lib/types/aggregate-item";
    export const transformAggregateItems2SqlString: (sql: string, aggregateItems: AggregateItem[], groupByColumns?: string[], selectedFields?: string[]) => string;
}
declare module "packages/worker/web-worker/meta-table/embedding" {
    import { BaseTable, BaseTableImpl } from "packages/worker/web-worker/meta-table/base";
    export interface IEmbedding {
        id: string;
        embedding: string;
        model: string;
        raw_content: string;
        source_type: "doc" | "table" | "file";
        source: string;
    }
    export class EmbeddingTable extends BaseTableImpl implements BaseTable<IEmbedding> {
        name: string;
        createTableSql: string;
        add(data: IEmbedding): Promise<IEmbedding>;
        get(id: string): Promise<IEmbedding | null>;
        set(id: string, data: Partial<IEmbedding>): Promise<boolean>;
        del(id: string): Promise<boolean>;
    }
}
declare module "packages/lib/embedding/worker" {
    export const getEmbeddingWorker: () => Worker;
    export const embeddingTexts: (texts: string[]) => Promise<unknown>;
}
declare module "packages/lib/ai/llm_vendors/base" {
    export abstract class LLMBaseVendor {
        abstract name: string;
        abstract embedding(text: string[], model: string): Promise<number[][]>;
    }
}
declare module "packages/lib/ai/llm_vendors/bge" {
    import { LLMBaseVendor } from "packages/lib/ai/llm_vendors/base";
    export class BGEM3 implements LLMBaseVendor {
        name: string;
        _embedding?: (text: string[]) => Promise<number[][]>;
        constructor(embedding?: (text: string[]) => Promise<number[][]>);
        embedding(text: string[], model: string): Promise<number[][]>;
    }
}
declare module "packages/lib/ai/helper" {
    export type LLMProviderType = "openai" | "google" | "deepseek" | "groq" | "xai" | "openrouter" | "anthropic" | "azure" | "amazon-bedrock" | "deepinfra" | "mistral" | "togetherai" | "cohere" | "fireworks" | "cerebras" | "perplexity" | "ollama" | "openai-compatible";
    export const ALL_PROVIDERS_RAW: string[];
    export const LLM_PROVIDER_INFO: Record<LLMProviderType, {
        name: string;
        baseUrl: string;
        urlForGettingApiKey?: string;
    }>;
    export const ALL_PROVIDERS: LLMProviderType[];
    export interface AvailableModel {
        id: string;
        label: string;
    }
    export function fetchAvailableModels(apiKey: string, providerType: LLMProviderType, baseUrl?: string): Promise<AvailableModel[]>;
    export function getProvider(data: {
        apiKey?: string;
        baseUrl?: string;
        type?: LLMProviderType;
    }): import("@ai-sdk/openai").OpenAIProvider | import("@ai-sdk/google").GoogleGenerativeAIProvider | import("@ai-sdk/deepseek").DeepSeekProvider | import("@ai-sdk/groq").GroqProvider | import("@ai-sdk/xai").XaiProvider | import("@ai-sdk/anthropic").AnthropicProvider | import("@ai-sdk/azure").AzureOpenAIProvider | import("@ai-sdk/amazon-bedrock").AmazonBedrockProvider | import("@ai-sdk/mistral").MistralProvider | import("@ai-sdk/cohere").CohereProvider | import("@ai-sdk/perplexity").PerplexityProvider | import("@openrouter/ai-sdk-provider").OpenRouterProvider | import("@ai-sdk/deepinfra").DeepInfraProvider | import("@ai-sdk/cerebras").CerebrasProvider;
}
declare module "packages/lib/ai/config" {
    import { z } from "zod";
    import { LLMProviderType } from "packages/lib/ai/helper";
    export const llmProviderSchema: z.ZodObject<{
        type: z.ZodDefault<z.ZodEnum<[LLMProviderType, ...LLMProviderType[]]>>;
        name: z.ZodString;
        apiKey: z.ZodOptional<z.ZodString>;
        baseUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        models: z.ZodDefault<z.ZodString>;
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        type?: LLMProviderType;
        enabled?: boolean;
        apiKey?: string;
        baseUrl?: string;
        models?: string;
    }, {
        name?: string;
        type?: LLMProviderType;
        enabled?: boolean;
        apiKey?: string;
        baseUrl?: string;
        models?: string;
    }>;
    export type LLMProvider = z.infer<typeof llmProviderSchema>;
    export const aiFormSchema: z.ZodObject<{
        localModels: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        llmProviders: z.ZodDefault<z.ZodArray<z.ZodObject<{
            type: z.ZodDefault<z.ZodEnum<[LLMProviderType, ...LLMProviderType[]]>>;
            name: z.ZodString;
            apiKey: z.ZodOptional<z.ZodString>;
            baseUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            models: z.ZodDefault<z.ZodString>;
            enabled: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            name?: string;
            type?: LLMProviderType;
            enabled?: boolean;
            apiKey?: string;
            baseUrl?: string;
            models?: string;
        }, {
            name?: string;
            type?: LLMProviderType;
            enabled?: boolean;
            apiKey?: string;
            baseUrl?: string;
            models?: string;
        }>, "many">>;
        autoLoadEmbeddingModel: z.ZodDefault<z.ZodBoolean>;
        embeddingModel: z.ZodOptional<z.ZodString>;
        translationModel: z.ZodOptional<z.ZodString>;
        codingModel: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        localModels?: string[];
        llmProviders?: {
            name?: string;
            type?: LLMProviderType;
            enabled?: boolean;
            apiKey?: string;
            baseUrl?: string;
            models?: string;
        }[];
        autoLoadEmbeddingModel?: boolean;
        embeddingModel?: string;
        translationModel?: string;
        codingModel?: string;
    }, {
        localModels?: string[];
        llmProviders?: {
            name?: string;
            type?: LLMProviderType;
            enabled?: boolean;
            apiKey?: string;
            baseUrl?: string;
            models?: string;
        }[];
        autoLoadEmbeddingModel?: boolean;
        embeddingModel?: string;
        translationModel?: string;
        codingModel?: string;
    }>;
    export type AIFormValues = z.infer<typeof aiFormSchema>;
}
declare module "packages/lib/ai/doc_loader/base" {
    export abstract class BaseLoader {
        abstract load(docId: string): Promise<{
            content: string;
            meta: Record<string, any>;
        }[]>;
    }
}
declare module "packages/lib/ai/doc_loader/doc" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    import { BaseLoader } from "packages/lib/ai/doc_loader/base";
    export class DocLoader implements BaseLoader {
        private dataSpace;
        constructor(dataSpace: DataSpace);
        load(docId: string): Promise<{
            content: string;
            meta: Record<string, any>;
        }[]>;
    }
}
declare module "packages/lib/ai/vec_search" {
    export const getHnswIndex: (model: string, filename: string) => Promise<{
        vectorHnswIndex: import("hnswlib-wasm/dist/hnswlib-wasm").HierarchicalNSW;
        exists: boolean;
    }>;
}
declare module "packages/lib/web/file" {
    export const downloadFile: (file: Blob, name: string) => void;
}
declare module "packages/lib/markdown" {
    export const getAllCodeBlocks: (markdown: string) => {
        code: string;
        lang: string;
    }[];
    /**
     * get all code blocks from llm-response tags
     * @param markdown
     * @returns
     */
    export const getAllLLMResponseCodeBlocks: (markdown: string) => {
        code: string;
        lang: string;
    }[];
    /**
     * get all links from markdown, but not include image
     * @param markdown
     * @returns
     */
    export const getAllLinks: (markdown: string) => string[];
    export const getCodeFromMarkdown: (markdown: string) => {
        code: string;
        lang: string;
    }[];
}
declare module "packages/lib/sqlite/channel/http" {
    import { MsgType } from "packages/lib/const";
    import { ISqlite } from "packages/lib/sqlite/interface";
    interface IHttpSendData {
        type: MsgType.CallFunction;
        data: {
            method: string;
            params: any[];
            dbName: string;
            tableId?: string;
            userId?: string;
        };
        id: string;
    }
    export class HttpSqlite implements ISqlite<string, IHttpSendData> {
        connector: string;
        responseMap: Map<string, any>;
        constructor(connector: string);
        send(data: IHttpSendData): Promise<void>;
        onCallBack(thisCallId: string, timeout?: number, interval?: number): Promise<unknown>;
    }
}
declare module "packages/lib/sqlite/channel/local" {
    import { MsgType } from "packages/lib/const";
    import type { IpcRenderer } from 'electron';
    export interface ISqlite<T, D> {
        connector: T;
        send: (data: D) => void;
        onCallBack: (thisCallId: string) => Promise<any>;
    }
    export interface ILocalSendData {
        type: MsgType.CallFunction;
        data: {
            method: string;
            params: any[];
            dbName: string;
            tableId?: string;
            userId?: string;
        };
        id: string;
    }
    export class LocalSqlite implements ISqlite<Worker | IpcRenderer, ILocalSendData> {
        connector: Worker | IpcRenderer;
        channel: MessageChannel;
        channelMap: Map<string, MessageChannel>;
        dataMap: Map<string, any>;
        options?: {
            readonly?: boolean;
        };
        constructor(connector: Worker | IpcRenderer, options?: {
            readonly?: boolean;
        });
        getChannel(id: string): MessageChannel;
        destroyChannel(id: string): void;
        send(data: ILocalSendData): Promise<any>;
        onCallBack(thisCallId: string): Promise<unknown>;
    }
}
declare module "packages/lib/sqlite/worker" {
    export const getWorker: () => Worker;
}
declare module "packages/lib/collaboration/interface" {
    import { MsgType } from "packages/lib/const";
    import { IQueryResp } from "packages/lib/sqlite/interface";
    export interface ICollaborator {
        id: string;
        name: string;
    }
    export enum ECollaborationMsgType {
        JOIN = "JOIN",
        LEAVE = "LEAVE",
        MOVE_CURSOR = "MOVE_CURSOR",
        QUERY = "QUERY",
        QUERY_RESP = "QUERY_RESP",
        FORWARD = "FORWARD"
    }
    export interface IMsgJoin {
        type: ECollaborationMsgType.JOIN;
        payload: {
            collaborator: ICollaborator;
        };
    }
    export interface IMsgLeave {
        type: ECollaborationMsgType.LEAVE;
        payload: {
            collaborator: ICollaborator;
        };
    }
    export interface IMsgMoveCursor {
        type: ECollaborationMsgType.MOVE_CURSOR;
        payload: {
            collaboratorId: string;
            cursor: [number, number];
        };
    }
    export interface IMsgQuery {
        type: ECollaborationMsgType.QUERY;
        payload: {
            collaboratorId: string;
            query: {
                type: MsgType.CallFunction;
                data: {
                    method: string;
                    params: [string, string[]];
                    dbName: string;
                };
                id: string;
            };
        };
    }
    export interface IMsgForward {
        type: ECollaborationMsgType.FORWARD;
        payload: {
            collaboratorId: string;
            msg: any;
        };
    }
    export interface IMsgQueryResp {
        type: ECollaborationMsgType.QUERY_RESP;
        payload: IQueryResp;
    }
    export type IMsg = IMsgJoin | IMsgLeave | IMsgMoveCursor | IMsgQuery | IMsgForward;
}
declare module "packages/lib/sqlite/channel/webrtc" {
    import { DataConnection } from "peerjs";
    export interface ISqlite<T, D> {
        connector: T;
        send: (data: D) => void;
        onCallBack: (thisCallId: string) => Promise<any>;
    }
    export class RemoteSqlite implements ISqlite<DataConnection, any> {
        connector: DataConnection;
        bc: BroadcastChannel;
        constructor(connector: DataConnection);
        send(data: any): void;
        onCallBack(thisCallId: string): Promise<unknown>;
    }
}
declare module "packages/lib/sqlite/channel/index" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    import { DataConnection } from "peerjs";
    import { ILocalSendData } from "packages/lib/sqlite/channel/local";
    import { ISqlite } from "packages/lib/sqlite/interface";
    type IConfig = {
        isShareMode?: boolean;
        connection?: DataConnection;
        isReadonly?: boolean;
    };
    export const getSqliteChannel: (dbName: string, userId: string, config?: IConfig) => ISqlite<any, ILocalSendData>;
    export const getSqliteProxy: (dbName: string, userId: string, config?: IConfig) => DataSpace;
}
declare module "packages/lib/fields/link" {
    import { LinkCell } from "components/table/views/grid/cells/link/link-cell";
    import { BaseField } from "packages/lib/fields/base";
    import { FieldType } from "packages/lib/fields/const";
    export type ILinkProperty = {
        linkTableName: string;
        linkColumnName: string;
    };
    export type LinkCellData = {
        id: string;
        title: string;
        img?: string;
    };
    export class LinkField extends BaseField<LinkCell, ILinkProperty> {
        static type: FieldType;
        rawData2JSON(rawData: string): string;
        get compareOperators(): any[];
        getCellContent(rawData: string, context?: {
            row?: Record<string, string>;
        }): LinkCell;
        cellData2RawData(cell: LinkCell): {
            rawData: string;
        };
    }
}
declare module "packages/lib/sqlite/sql-alter-column-type" {
    /**
     * 1. add new column with new type
     * 2. copy data from old column to new column
     * 3. rename old column to old column + "_old"
     * 4. rename new column to old column
     * 5. drop old column
     * @param tableName
     * @param columnName
     * @param newType
     */
    export const alterColumnType: (tableName: string, columnName: string, newType: "TEXT" | "REAL" | "INT") => string;
}
declare module "packages/worker/web-worker/meta-table/column" {
    import { FieldType } from "packages/lib/fields/const";
    import { IField } from "packages/lib/store/interface";
    import { BaseServerDatabase } from "packages/lib/sqlite/interface";
    import { BaseTable, BaseTableImpl } from "packages/worker/web-worker/meta-table/base";
    /**
     * define
     * 1. column: a real column in table
     * 2. field: a wrapper of column, with some additional properties which control the UI behavior
     *
     * this table is used to manage the mapping between column and field
     */
    export class ColumnTable extends BaseTableImpl implements BaseTable<IField> {
        name: string;
        createTableSql: string;
        JSONFields: string[];
        static getColumnTypeByFieldType(type: FieldType): any;
        add(data: IField): Promise<IField>;
        addField(data: IField): Promise<IField>;
        getColumn<T = any>(tableName: string, tableColumnName: string): Promise<IField<T> | null>;
        set(id: string, data: Partial<IField>): Promise<boolean>;
        del(id: string): Promise<boolean>;
        deleteField(tableName: string, tableColumnName: string): Promise<string[]>;
        /**
         * @param tableName tb_<uuid>
         */
        deleteByRawTableName(tableName: string, db?: BaseServerDatabase): Promise<void>;
        /**
         * Update formula column and handle dependencies
         * @param tableName Table name
         * @param tableColumnName Column name
         * @param property New property
         * @param fields All fields
         * @param db Database connection
         */
        private updateFormulaColumn;
        updateProperty(data: {
            tableName: string;
            tableColumnName: string;
            property: any;
            type: FieldType;
        }): Promise<void>;
        list(q: {
            table_name: string;
        }): Promise<IField[]>;
        static isColumnTypeChanged(oldType: FieldType, newType: FieldType): boolean;
        changeType(tableName: string, tableColumnName: string, newType: FieldType): Promise<void>;
    }
}
declare module "packages/lib/fields/helper" {
    import { FieldType } from "packages/lib/fields/const";
    export const isComputedField: (columnType: FieldType) => boolean;
    export const isAutoGeneratedField: (columnType: FieldType) => boolean;
}
declare module "packages/lib/fields/lookup" {
    import { IField } from "packages/lib/store/interface";
    import { BaseField } from "packages/lib/fields/base";
    import { FieldType } from "packages/lib/fields/const";
    import { ILinkProperty } from "packages/lib/fields/link";
    export type ILookupProperty = {
        linkFieldId: string;
        lookupTargetFieldId: string;
    };
    /**
     * a -> b -> c -> d ....
     * if a&b&c&d are lookup field, we need to get the lookup fields map from a to d
     * walk through the lookup fields, and get the lookup fields map
     */
    export type ILookupContext = {
        linkField: IField<ILinkProperty> | null;
        lookupTargetFieldsMap: {
            [lookupTargetTableId: string]: {
                [fieldId: string]: {
                    field: IField<any>;
                    context: ILookupContext | null;
                };
            };
        };
    };
    export class LookupField extends BaseField<any, ILookupProperty, any, any, ILookupContext> {
        static type: FieldType;
        /**
         * get target field instance, no matter it is a lookup field or not
         * we will store all lookup cell data in database, if we want to get lookup cell data, we just need to get the target field
         * do not need to get the entity field instance
         * @returns
         */
        getTargetFieldInstance(): BaseField<any, any, any, any, any> | null;
        /**
         * for render, we need to get the entity field instance
         * a->b->c->d
         * maybe a&b&c are lookup field, but d is not a lookup field
         * we will get the target field recursively until the target field is not a lookup field
         * @returns
         */
        get entityFieldInstance(): BaseField<any, any, any, any, any> | LookupField | null;
        get displayType(): FieldType;
        rawData2JSON(rawData: any): any;
        get compareOperators(): any;
        getCellContent(rawData: string, context: any): any;
        cellData2RawData(cell: any): {
            rawData: any;
        };
    }
}
declare module "packages/lib/sqlite/sql-sort-parser" {
    import { OrderByItem } from "components/table/view-sort-editor";
    import { IField } from "packages/lib/store/interface";
    export const getSortColumns: (query: string) => string[];
    /**
     * before call this function, the query sql must be transformed by transformQueryWithFormulaFields2Sql.
     * because orderBy may be included formula fields
     * @param query
     * @returns
     */
    export const rewriteQuery2getSortedRowIds: (query: string, useTempTable?: boolean) => string;
    export const _rewriteQuery2getSortedSqliteRowIds: (query: string) => string;
    export const rewriteQuery2getSortedSqliteRowIds: (query: string, totalCount: number, batchSize?: number) => string[];
    export const rewriteQueryWithSortedQuery: (query: string, sortedQuery: string) => string;
    export const rewriteQueryWithOffsetAndLimit: (query: string, offset: number, limit: number) => string;
    export const hasOrderBy: (query?: string) => boolean;
    export const transformQueryWithOrderBy2Sql: (orderBy: OrderByItem[], query: string, fieldMap: {
        [fieldId: string]: IField<any>;
    }) => string;
}
declare module "packages/lib/sqlite/sql-filter-parser" {
    import { ExprBinary } from "pgsql-ast-parser";
    import { FilterValueType } from "components/table/view-filter-editor/interface";
    import { BinaryOperator, CompareOperator } from "packages/lib/fields/const";
    export const isLogicOperator: (op: string) => op is BinaryOperator;
    export const reverseOpMap: Record<BinaryOperator | CompareOperator, string>;
    export const expr2FilterValue: (expr: ExprBinary) => FilterValueType;
    export const transformSql2FilterItems: (sql: string) => FilterValueType;
    export const transformFilterItems2SqlExpr: (filterItems: FilterValueType) => any;
    export const transformFilterItems2SqlString: (sql: string, filterItems: FilterValueType | null) => string;
    export const getFilterColumns: (query: string) => string[];
}
declare module "packages/lib/sqlite/sql-view-query" {
    export const isFieldsInQuery: (query: string, fields: string[]) => boolean;
    export const rewriteQueryWithRowId: (query: string) => string;
    export const rewriteQueryWithOffsetAndLimit: (query: string, offset?: number, limit?: number) => string;
}
declare module "packages/worker/service-worker/backup/provider/base" {
    export abstract class BaseBackupServer {
        pull(directoryPath: string): Promise<void>;
        private getOPFSManager;
        private getOPFSDatabaseFile;
        private pullDBFile;
        private pushDBFile;
        push(directoryPath: string): Promise<void>;
        getLocalFile(path: string): Promise<File | null>;
        walkLocalDirectory(directory: string): Promise<string[]>;
        save2LocalFile(path: string, file: File): Promise<string[]>;
        deleteLocalFile(path: string): Promise<void>;
        shouldUpload(localFileLastModifiedTime: Date, remoteFileLastModifiedTime: Date): boolean;
        abstract walk(directory: string): Promise<string[]>;
        abstract uploadFile(path: string, file: File): Promise<void>;
        abstract getFile(path: string): Promise<File | null>;
        abstract deleteFile(path: string): Promise<void>;
        abstract getLastModifiedTime(file: string): Promise<Date | null>;
    }
}
declare module "packages/worker/service-worker/backup/provider/github" {
    import { Octokit } from "@octokit/rest";
    import { BaseBackupServer } from "packages/worker/service-worker/backup/provider/base";
    export class GithubBackupServer extends BaseBackupServer {
        private token;
        private owner;
        private repo;
        octokit: Octokit;
        constructor(token: string, owner: string, repo: string);
        getFile(path: string): Promise<File | null>;
        deleteFile(path: string): Promise<void>;
        getLastModifiedTime(file: string): Promise<Date | null>;
        dirExists(path: string): Promise<boolean>;
        walk(directory: string): Promise<string[]>;
        _walk(directory: string): Promise<string[]>;
        uploadFile(path: string, file: File): Promise<void>;
    }
}
declare module "packages/worker/service-worker/backup/index" {
    export const getConfigFromOpfs: () => Promise<{
        spaceList?: string;
        Github__repo?: string;
        Github__token?: string;
        Github__enabled?: boolean;
        S3__endpointUrl?: string;
        S3__accessKeyId?: string;
        S3__secretAccessKey?: string;
        S3__enabled?: boolean;
        autoSaveGap?: number;
    }>;
    export const getLastSyncStatus: () => Promise<Record<string, string>>;
    export const updateLastSyncStatus: (syncStatus: Record<string, string>) => Promise<void>;
    export const backUpPushOnce: () => Promise<void>;
    export const backUpPullOnce: () => Promise<void>;
    export const autoBackup: () => Promise<void>;
    export const backupAllSpaceData: () => Promise<void>;
}
declare module "packages/lib/web/crypto" {
    export const getKeyPair: () => Promise<CryptoKeyPair>;
    export const PUBLIC_KEY: {
        crv: string;
        ext: boolean;
        key_ops: string[];
        kty: string;
        x: string;
        y: string;
    };
    export function verifyMessage(payload: object, signature: ArrayBuffer): Promise<boolean>;
    /**
     * file checksum sha3-256
     * return checksum
     */
    export function fileChecksum(file: File): Promise<string>;
}
declare module "packages/lib/fields/multi-select" {
    import { MultiSelectCell } from "components/table/views/grid/cells/multi-select-cell";
    import { BaseField } from "packages/lib/fields/base";
    import { CompareOperator, FieldType } from "packages/lib/fields/const";
    import { SelectProperty } from "packages/lib/fields/select";
    type MultiSelectProperty = SelectProperty;
    export class MultiSelectField extends BaseField<MultiSelectCell, MultiSelectProperty, string> {
        static type: FieldType;
        get compareOperators(): CompareOperator[];
        get type(): FieldType;
        get options(): import("@/lib/fields/select").SelectOption[];
        addOption(name: string): import("@/lib/fields/select").SelectOption[];
        rawData2JSON(rawData: string | null): string[];
        /**
         * in database we store the tags as a string, so we need to convert it to an array of strings
         * e.g.
         * "tag1,tag2,tag3" => ["tag1", "tag2", "tag3"]
         * "tag1, tag2 with space" => ["tag1", "tag2 with space"]
         * @param rawData
         * @returns
         */
        getCellContent(rawData: string): MultiSelectCell;
        /**
         * @param text tag1,tag2
         * return tag1id,tag2id
         */
        cellData2RawData(cell: MultiSelectCell): {
            rawData: any;
            shouldUpdateColumnProperty?: undefined;
        } | {
            rawData: string;
            shouldUpdateColumnProperty: boolean;
        };
        createFieldProperty(): {
            options: any[];
        };
    }
}
declare module "packages/lib/fields/select" {
    import type { SelectCell } from "components/table/views/grid/cells/select-cell";
    import { BaseField } from "packages/lib/fields/base";
    import { CompareOperator, FieldType } from "packages/lib/fields/const";
    import { MultiSelectCell } from "components/table/views/grid/cells/multi-select-cell";
    export type SelectOption = {
        id: string;
        name: string;
        color: string;
    };
    export type SelectProperty = {
        options: SelectOption[];
        defaultOption?: string;
    };
    export class SelectField extends BaseField<SelectCell, SelectProperty> {
        static type: FieldType;
        static colors: {
            light: {
                name: string;
                value: string;
            }[];
            dark: {
                name: string;
                value: string;
            }[];
        };
        static defaultColor: string;
        static colorNameValueMap: {
            light: Record<string, string>;
            dark: Record<string, string>;
        };
        /**
         * @param colorName name of the color. eg "default" | "gray"
         * @param theme theme of the color. eg "light" | "dark"
         * @returns hex value of the color. eg "#cccccc"
         */
        static getColorValue(colorName: string, theme?: "light" | "dark", opacity?: number): string;
        get compareOperators(): CompareOperator[];
        get options(): SelectOption[];
        rawData2JSON(rawData: any): string;
        getCellContent(rawData: string): SelectCell;
        /**
         * getCellContentViaLookup is used when the field is used as a lookup target field.
         * lookup will convert the raw data to a multi-select cell, value split by comma.
         * @param rawData
         * @returns
         */
        getCellContentViaLookup(rawData: string): MultiSelectCell;
        cellData2RawData(cell: SelectCell): {
            rawData: string;
            shouldUpdateColumnProperty?: undefined;
        } | {
            rawData: string;
            shouldUpdateColumnProperty: boolean;
        };
        static getDefaultFieldProperty(): {
            options: any[];
        };
        static generateOptionsByNames(names: string[]): {
            id: string;
            name: string;
            color: string;
        }[];
        changeOptionName(id: string, newName: string): void;
        changeOptionColor(id: string, newColor: string): void;
        static getNextAvailableColor(existingOptions: SelectOption[]): string;
        addOption(name: string): SelectOption[];
        deleteOption(id: string): void;
    }
}
declare module "packages/lib/sqlite/sql-parser" {
    export const getColumnsFromQuery: (sql?: string) => import("pgsql-ast-parser").SelectedColumn[];
    export const replaceQueryTableName: (query: string, tableNameMap: Record<string, string>) => string;
    export const replaceWithFindIndexQuery: (query: string, rowId: string) => string;
    /**
     * transform sql query replace column name with columnNameMap
     * @param sql
     * @param columnNameMap
     * @returns transformed sql
     */
    export const transformSql: (sql: string, rawTableName: string, columnNameMap: Map<string, string>) => string;
}
declare module "packages/lib/ai/generate" {
    export const generateText: ({ prompt, modelId, systemPrompt, config, }: {
        prompt: string;
        systemPrompt?: string;
        modelId: string;
        config: {
            apiKey: string;
            baseURL: string;
        };
    }) => Promise<string>;
}
declare module "packages/lib/fields/formula" {
    import type { TextCell } from "@glideapps/glide-data-grid";
    import { BaseField } from "packages/lib/fields/base";
    import { FieldType } from "packages/lib/fields/const";
    export type FormulaProperty = {
        formula: string;
        displayType?: FieldType;
    };
    export class FormulaField extends BaseField<TextCell, FormulaProperty> {
        static type: FieldType;
        get compareOperators(): any[];
        get displayType(): FieldType;
        rawData2JSON(rawData: string): string;
        getCellContent(rawData: string): TextCell;
        cellData2RawData(cell: TextCell): {
            rawData: string;
        };
    }
}
declare module "packages/lib/fields/number" {
    import type { NumberCell } from "@glideapps/glide-data-grid";
    import { RangeCell } from "components/table/views/grid/cells/range-cell";
    import { BaseField } from "packages/lib/fields/base";
    import { FieldType } from "packages/lib/fields/const";
    export type NumberProperty = {
        format: "number" | "percent" | "currency";
        showAs: "number" | "bar" | "ring";
        color: string;
        divideBy: number;
        showNumber: boolean;
    };
    export class NumberField extends BaseField<NumberCell | RangeCell, NumberProperty, number> {
        static type: FieldType;
        get compareOperators(): import("@/lib/fields/const").CompareOperator[];
        rawData2JSON(rawData: number): number;
        getCellContent(rawData: number | undefined): NumberCell | RangeCell;
        cellData2RawData(cell: NumberCell | RangeCell): {
            rawData: number;
        };
    }
}
declare module "packages/worker/web-worker/sdk/service/text" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    import { TableManager } from "packages/worker/web-worker/sdk/table";
    import { IField } from "packages/lib/store/interface";
    import { TextProperty } from "packages/lib/fields/text";
    export interface IVecMeta {
        updateAt: number;
        outOfDate: boolean;
    }
    export class TextFieldService {
        private table;
        dataSpace: DataSpace;
        constructor(table: TableManager);
        queryEmbedding: (fieldId: string, query: string, limit?: number) => Promise<any>;
        updateEmbedding: (fieldId: string, data: {
            recordId: string;
            value: string;
        }[]) => Promise<void>;
        resetEmbedding: (fieldId: string) => Promise<void>;
        onPropertyChange: (oldField: IField<TextProperty>, property: TextProperty) => Promise<void>;
        /**
     * when user delete a link field, we also need to delete the paired link field and delete relation data
     */
        beforeDeleteColumn(tableName: string, columnName: string, db?: import("@/lib/sqlite/interface").BaseServerDatabase): Promise<void>;
        /**
         * Get statistics about the embedding status for a text field
         * @param fieldId The field ID to get statistics for
         * @returns Statistics about vectorization status
         */
        getEmbeddingStats(fieldId: string): Promise<{
            total: number;
            vectorized: number;
            outdated: number;
            upToDate: number;
            vectorizedPercentage: number;
            outdatedPercentage: number;
            upToDatePercentage: number;
        }>;
    }
}
declare module "packages/lib/fields/text" {
    import type { TextCell } from "@glideapps/glide-data-grid";
    import { BaseField } from "packages/lib/fields/base";
    import { FieldType } from "packages/lib/fields/const";
    export interface TextProperty {
        model?: string | null;
        enableEmbedding?: boolean | null;
        enableColorHint?: boolean | null;
    }
    interface CellContext {
        row: Record<string, any>;
        theme?: 'dark' | 'light';
    }
    export class TextField extends BaseField<TextCell, TextProperty> {
        static type: FieldType;
        get compareOperators(): import("@/lib/fields/const").CompareOperator[];
        rawData2JSON(rawData: string): string;
        getCellContent(rawData: string | null, context?: CellContext): TextCell;
        cellData2RawData(cell: TextCell): {
            rawData: string;
        };
    }
}
declare module "packages/lib/fields/file" {
    import type { FileCell } from "components/table/views/grid/cells/file/file-cell";
    import { BaseField } from "packages/lib/fields/base";
    import { CompareOperator, FieldType } from "packages/lib/fields/const";
    export type FileProperty = {
        proxyUrl?: string;
    };
    export class FileField extends BaseField<FileCell, FileProperty, string> {
        static type: FieldType;
        rawData2JSON(rawData: string): string;
        get compareOperators(): CompareOperator[];
        static getDefaultFieldProperty(): {
            proxyUrl: string;
        };
        /**
         * we need to proxy the image to avoid CORS issue. if the image is a remote url, we will proxy it
         */
        getProxyData: (data: string[]) => string[];
        private encodeComma;
        private decodeComma;
        getCellContent(rawData: string): FileCell;
        cellData2RawData(cell: FileCell): {
            rawData: string;
        };
    }
}
declare module "packages/lib/fields/last-edited-by" {
    import { UserProfileCell } from "components/table/views/grid/cells/user-profile-cell";
    import { BaseField } from "packages/lib/fields/base";
    import { CompareOperator, FieldType } from "packages/lib/fields/const";
    import { UserFieldContext } from "packages/lib/fields/created-by";
    type LastEditedByProperty = {};
    export class LastEditedByField extends BaseField<UserProfileCell, LastEditedByProperty, string, UserFieldContext> {
        static type: FieldType;
        rawData2JSON(rawData: string): string;
        get compareOperators(): CompareOperator[];
        getCellContent(rawData: string | undefined, context?: UserFieldContext): UserProfileCell;
        cellData2RawData(cell: UserProfileCell): {
            rawData: import("@/components/table/views/grid/cells/user-profile-cell").UserProfileCellProps;
        };
    }
}
declare module "packages/lib/fields/last-edited-time" {
    import { TextCell } from "@glideapps/glide-data-grid";
    import { BaseField } from "packages/lib/fields/base";
    import { CompareOperator, FieldType } from "packages/lib/fields/const";
    type DateProperty = {};
    export class LastEditedTimeField extends BaseField<TextCell, DateProperty, string> {
        static type: FieldType;
        rawData2JSON(rawData: string): string;
        get compareOperators(): CompareOperator[];
        getCellContent(rawData: string | undefined): TextCell;
        cellData2RawData(cell: TextCell): {
            rawData: string;
        };
    }
}
declare module "packages/lib/fields/rating" {
    import type { RatingCell } from "components/table/views/grid/cells/rating-cell";
    import { BaseField } from "packages/lib/fields/base";
    import { CompareOperator, FieldType } from "packages/lib/fields/const";
    type RatingProperty = {};
    export class RatingField extends BaseField<RatingCell, RatingProperty, number> {
        static type: FieldType;
        get compareOperators(): CompareOperator[];
        rawData2JSON(rawData: number): number;
        getCellContent(rawData: number): RatingCell;
        cellData2RawData(cell: RatingCell): {
            rawData: number;
        };
    }
}
declare module "packages/lib/fields/title" {
    import type { TextCell } from "@glideapps/glide-data-grid";
    import { BaseField } from "packages/lib/fields/base";
    import { CompareOperator, FieldType } from "packages/lib/fields/const";
    type TitleProperty = {};
    export class TitleField extends BaseField<TextCell, TitleProperty> {
        static type: FieldType;
        get compareOperators(): CompareOperator[];
        rawData2JSON(rawData: string): string;
        getCellContent(rawData: string): TextCell;
        cellData2RawData(cell: TextCell): {
            rawData: string;
        };
    }
}
declare module "packages/lib/fields/url" {
    import type { UriCell } from "@glideapps/glide-data-grid";
    import { BaseField } from "packages/lib/fields/base";
    import { FieldType } from "packages/lib/fields/const";
    type URLProperty = {};
    type URLCell = UriCell;
    export class URLField extends BaseField<URLCell, URLProperty> {
        static type: FieldType;
        get compareOperators(): import("@/lib/fields/const").CompareOperator[];
        rawData2JSON(rawData: string): string;
        getCellContent(rawData: string): URLCell;
        cellData2RawData(cell: URLCell): {
            rawData: string;
        };
    }
}
declare module "packages/lib/fields/index" {
    import { IField } from "packages/lib/store/interface";
    import { BaseField } from "packages/lib/fields/base";
    import { CheckboxField } from "packages/lib/fields/checkbox";
    import { FieldType } from "packages/lib/fields/const";
    import { CreatedByField } from "packages/lib/fields/created-by";
    import { CreatedTimeField } from "packages/lib/fields/created-time";
    import { DateField } from "packages/lib/fields/date";
    import { FileField } from "packages/lib/fields/file";
    import { FormulaField } from "packages/lib/fields/formula";
    import { LinkField } from "packages/lib/fields/link";
    import { LookupField } from "packages/lib/fields/lookup";
    import { MultiSelectField } from "packages/lib/fields/multi-select";
    import { NumberField } from "packages/lib/fields/number";
    import { RatingField } from "packages/lib/fields/rating";
    import { SelectField } from "packages/lib/fields/select";
    import { TextField } from "packages/lib/fields/text";
    import { URLField } from "packages/lib/fields/url";
    const baseFieldTypes: (typeof CheckboxField | typeof CreatedByField | typeof CreatedTimeField | typeof DateField | typeof LinkField | typeof FileField | typeof MultiSelectField | typeof NumberField | typeof RatingField | typeof SelectField | typeof TextField | typeof URLField | typeof FormulaField)[];
    type FieldTypeAndClsMap = {
        [key in FieldType]: (typeof baseFieldTypes)[number];
    } & {
        [FieldType.Lookup]: typeof LookupField;
    };
    export const allFieldTypesMap: FieldTypeAndClsMap;
    export function getFieldInstance<T = BaseField<any, any, any, any, any>>(field: IField<any>, context?: any): T;
}
declare module "packages/worker/web-worker/store" {
    export const workerStore: {
        currentCallUserId: string | null;
    };
}
declare module "packages/worker/web-worker/sdk/rows" {
    import type { IField } from "packages/lib/store/interface";
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    import { TableManager } from "packages/worker/web-worker/sdk/table";
    export class RowsManager {
        private table;
        dataSpace: DataSpace;
        fieldMap?: {
            fieldRawColumnNameFieldMap: Record<string, IField>;
            fieldNameRawColumnNameMap: Record<string, string>;
        };
        tableManager: TableManager;
        constructor(table: TableManager);
        static getReadableRows(rows: Record<string, any>[], fields: IField[]): Record<string, any>[];
        getFieldMap(): Promise<{
            fieldRawColumnNameFieldMap: Record<string, IField>;
            fieldNameRawColumnNameMap: Record<string, string>;
        }>;
        static rawData2Json(row: Record<string, any>, fieldRawColumnNameFieldMap: Record<string, IField>): Record<string, any>;
        transformData(data: Record<string, any>, context: {
            fieldNameRawColumnNameMap: Record<string, string>;
            fieldRawColumnNameFieldMap: Record<string, IField>;
        }, options?: {
            useFieldId?: boolean;
        }): {
            notExistKeys: string[];
            rawData: {
                [k: string]: any;
            };
        };
        /**
         * get row by id
         * @param id
         * @returns
         */
        get(id: string, options?: {
            raw?: boolean;
            withRowId?: boolean;
        }): Promise<any>;
        /**
         * @param filter a filter object, the key is field name, the value is field value
         * @param options
         * @returns
         */
        query(filter?: Record<string, any>, options?: {
            viewId?: string;
            limit?: number;
            offset?: number;
            raw?: boolean;
            select?: string[];
            rawQuery?: string;
        }): Promise<Record<string, any>[]>;
        getCreateData(data: Record<string, any>): Record<string, any>;
        getUpdateData(data: Record<string, any>): {
            _last_edited_time: string;
            _last_edited_by: string;
        };
        /**
         * for high performance, use transaction
         * @param datas
         * @param fieldMap
         * @param options
         * @returns
         */
        batchSyncCreate(datas: Record<string, any>[], fieldMap: {
            fieldRawColumnNameFieldMap: Record<string, IField>;
            fieldNameRawColumnNameMap: Record<string, string>;
        }, options?: {
            useFieldId?: boolean;
        }): Record<string, any>[];
        create(data: Record<string, any>, options?: {
            useFieldId?: boolean;
        }): Promise<Record<string, any>>;
        delete(id: string): Promise<boolean>;
        batchDelete(ids: string[]): Promise<boolean>;
        private updateCellSideEffect;
        update(id: string, data: Record<string, any>, options?: {
            useFieldId?: boolean;
        }): Promise<{
            _last_edited_time: string;
            _last_edited_by: string;
            id: string;
        }>;
        /**
         * highlight the row if it is in the current view
         * @param id row id
         */
        highlight(id: string): Promise<void>;
    }
}
declare module "packages/worker/web-worker/sdk/service/link" {
    import { FieldType } from "packages/lib/fields/const";
    import { ILinkProperty } from "packages/lib/fields/link";
    import { IField } from "packages/lib/store/interface";
    import { DataSpace, EidosDatabase } from "packages/worker/web-worker/DataSpace";
    import { TableManager } from "packages/worker/web-worker/sdk/table";
    interface IRelation {
        self: string;
        ref: string;
        link_field_id: string;
    }
    export class LinkFieldService {
        private table;
        dataSpace: DataSpace;
        db: EidosDatabase;
        constructor(table: TableManager);
        getEffectRowsByRelationDeleted: (relationTableName: string, relation: IRelation, db?: import("@/lib/sqlite/interface").BaseServerDatabase) => Promise<{
            [x: string]: any;
        }>;
        /**
         * get diff between new value and old value
         * eg: new value is "1,2,3", old value is "1,2,3,4" => added: [], removed: [4]
         * eg: new value is "1,2,3,4", old value is "1,3" => added: [2,4], removed: []
         * eg: new value is "1,2,3,4", old value is "1,2,3,4" => added: [], removed: []
         * eg: new value is null, old value is "1,2,3,4" => added: [], removed: [1,2,3,4]
         * eg: new value is "1,2,3,4", old value is null => added: [1,2,3,4], removed: []
         * eg: new value is "1,3,4,5", old value is "1,2,3,4" => added: [5], removed: [2]
         * eg: new value is "1", old value is "2" => added: [1], removed: [2]
         * @param newValue
         * @param oldValue
         */
        getDiff: (newValue: string | null, oldValue: string | null) => {
            added: string[];
            removed: string[];
        };
        getEffectRows: (table_name: string, rowIds: string[], db?: import("@/lib/sqlite/interface").BaseServerDatabase) => Promise<Record<string, string[]>>;
        getTableNodeName: (tableName: string) => Promise<string>;
        getPairedLinkField: (data: IField<ILinkProperty>) => Promise<{
            name: string;
            type: FieldType;
            table_name: string;
            table_column_name: string;
            property: ILinkProperty;
        }>;
        getRelationTableName: (field: IField<ILinkProperty>) => string;
        getParentRelationTableName: (field: IField<ILinkProperty>) => string;
        getLinkCellTitle: (field: IField<ILinkProperty>, value: string | null) => Promise<string | null>;
        private getLinkCellValue;
        updateLinkCell: (tableName: string, tableColumnName: string, rowIds: string[]) => Promise<void>;
        /**
         * when user setCell, we also need to update the paired link field and update relation table
         * @param field
         * @param rowId
         * @param value
         * @param oldValue
         */
        updateLinkRelation: (field: IField<ILinkProperty>, rowId: string, value: string | null, oldValue: string | null) => Promise<void>;
        /**
         * when user add a link field, we also need to add a paired link field and create relation table and set trigger
         * @param data
         * @param db
         * @returns
         */
        addField: (data: IField<ILinkProperty>, db?: import("@/lib/sqlite/interface").BaseServerDatabase) => Promise<import("@/lib/sqlite/interface").BaseServerDatabase>;
        /**
         * when user delete a table, we need check if there are link fields in the table, if so, we need to delete the paired link field and delete relation table and delete trigger
         */
        beforeDeleteTable(tableName: string, db?: import("@/lib/sqlite/interface").BaseServerDatabase): Promise<void>;
        /**
         * when user delete a link field, we also need to delete the paired link field and delete relation data
         */
        beforeDeleteColumn(tableName: string, columnName: string, db?: import("@/lib/sqlite/interface").BaseServerDatabase): Promise<void>;
    }
}
declare module "packages/worker/web-worker/sdk/service/lookup" {
    import { ILookupContext, ILookupProperty } from "packages/lib/fields/lookup";
    import { IField } from "packages/lib/store/interface";
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    import { TableManager } from "packages/worker/web-worker/sdk/table";
    import { BaseServerDatabase } from "packages/lib/sqlite/interface";
    export class LookupFieldService {
        private table;
        dataSpace: DataSpace;
        constructor(table: TableManager);
        /**
         * find all fields that lookup field depends on
         */
        getLookupContext: (tableName: string, tableColumnName: string) => Promise<ILookupContext | null>;
        onPropertyChange: (field: IField<ILookupProperty>, newProperty: ILookupProperty) => Promise<void>;
        /**
         * <linkField>__title field can be treated as a lookup field and the lookupTargetField is the title field
         */
        getLinkTitleContext: (tableName: string, tableColumnName: string) => Promise<{
            targetTableColumnName: string;
            targetTableName: string;
            linkFieldId: string;
        }>;
        _getLookupContext: (tableName: string, tableColumnName: string) => Promise<{
            targetTableColumnName: string;
            targetTableName: string;
            linkFieldId: string;
        }>;
        getFieldContext: (tableName: string, tableColumnName: string) => Promise<{
            targetTableColumnName: string;
            targetTableName: string;
            linkFieldId: string;
        }>;
        /**
         *
         * @param id table_column_name
         */
        updateColumn: (data: {
            tableName: string;
            tableColumnName: string;
            db?: BaseServerDatabase;
            rowIds?: string[];
        }) => Promise<void>;
    }
}
declare module "packages/worker/web-worker/sdk/service/multi-select" {
    import { SelectProperty } from "packages/lib/fields/select";
    import { IField } from "packages/lib/store/interface";
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    import { TableManager } from "packages/worker/web-worker/sdk/table";
    export class MultiSelectFieldService {
        private table;
        dataSpace: DataSpace;
        constructor(table: TableManager);
        updateFieldPropertyIfNeed: (field: IField<SelectProperty>, value: string) => Promise<void>;
        updateSelectOptionName: (field: IField<SelectProperty>, update: {
            from: string;
            to: string;
        }) => Promise<void>;
        deleteSelectOption: (field: IField<SelectProperty>, option: string) => Promise<void>;
    }
}
declare module "packages/worker/web-worker/sdk/service/select" {
    import { SelectProperty } from "packages/lib/fields/select";
    import { IField } from "packages/lib/store/interface";
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    import { TableManager } from "packages/worker/web-worker/sdk/table";
    export class SelectFieldService {
        private table;
        dataSpace: DataSpace;
        constructor(table: TableManager);
        static MAX_SELECT_OPTIONS: number;
        updateFieldPropertyIfNeed: (field: IField<SelectProperty>, value: string) => Promise<void>;
        updateSelectOptionName: (field: IField<SelectProperty>, update: {
            from: string;
            to: string;
        }) => Promise<void>;
        deleteSelectOption: (field: IField<SelectProperty>, option: string) => Promise<void>;
        beforeConvert: (field: IField<any>, db?: import("@/lib/sqlite/interface").BaseServerDatabase) => Promise<{
            id: string;
            name: string;
            color: string;
        }[]>;
    }
}
declare module "packages/worker/web-worker/sdk/service/index" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    import { TableManager } from "packages/worker/web-worker/sdk/table";
    import { LinkFieldService } from "packages/worker/web-worker/sdk/service/link";
    import { LookupFieldService } from "packages/worker/web-worker/sdk/service/lookup";
    import { MultiSelectFieldService } from "packages/worker/web-worker/sdk/service/multi-select";
    import { SelectFieldService } from "packages/worker/web-worker/sdk/service/select";
    import { TextFieldService } from "packages/worker/web-worker/sdk/service/text";
    export class FieldsManager {
        private table;
        dataSpace: DataSpace;
        constructor(table: TableManager);
        all(): Promise<import("@/lib/store/interface").IField[]>;
        get lookup(): LookupFieldService;
        get select(): SelectFieldService;
        get multiSelect(): MultiSelectFieldService;
        get link(): LinkFieldService;
        get text(): TextFieldService;
    }
}
declare module "packages/worker/web-worker/sdk/service/compute" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    export class ComputeService {
        private dataSpace;
        constructor(dataSpace: DataSpace);
        updateEffectCells: (signal: {
            table: string;
            rowId: string;
            diff: Record<string, {
                old: any;
                new: any;
            }>;
            diffKeys: string[];
        }) => Promise<void>;
    }
}
declare module "packages/worker/web-worker/sdk/table" {
    import { IView } from "packages/lib/store/IView";
    import { DataSpace, EidosDatabase } from "packages/worker/web-worker/DataSpace";
    import { IndexManager } from "packages/worker/web-worker/sdk/index-manager";
    import { RowsManager } from "packages/worker/web-worker/sdk/rows";
    import { FieldsManager } from "packages/worker/web-worker/sdk/service/index";
    import { ComputeService } from "packages/worker/web-worker/sdk/service/compute";
    import { FieldType } from "packages/lib/fields/const";
    interface ITable {
        id: string;
        name: string;
        views: IView[];
    }
    export class TableManager {
        id: string;
        dataSpace: DataSpace;
        rawTableName: string;
        db: EidosDatabase;
        constructor(id: string, dataSpace: DataSpace);
        get compute(): ComputeService;
        get rows(): RowsManager;
        get fields(): FieldsManager;
        get index(): IndexManager;
        isExist(id: string): Promise<boolean>;
        get(id: string): Promise<ITable | null>;
        del(id: string): Promise<boolean>;
        hasSystemColumn(tableId: string, column: string): Promise<any>;
        fixTable(tableId: string): Promise<void>;
        static generateCreateTableSql(fields: Array<{
            name: string;
            type: FieldType;
        }>): {
            tableId: string;
            createTableSql: string;
        };
    }
}
declare module "packages/worker/web-worker/data-pipeline/DataChangeEventHandler" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    export class DataChangeEventHandler {
        private dataSpace;
        constructor(dataSpace: DataSpace);
        handleLinkRelationChange: (data: {
            table: string;
            _old: Record<string, any>;
            _new: Record<string, any>;
        }) => Promise<void>;
        static getDiff: (oldData: Record<string, any> | undefined, newData: Record<string, any>) => Record<string, {
            old: any;
            new: any;
        }>;
    }
}
declare module "packages/worker/web-worker/data-pipeline/DataChangeTrigger" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    type IRegisterTrigger = {
        update: string;
        insert: string;
        delete: string;
    };
    export class DataChangeTrigger {
        triggerMap: Map<string, IRegisterTrigger>;
        constructor();
        private getRowJSONObj;
        registerTrigger(space: string, tableName: string, trigger: IRegisterTrigger): Promise<void>;
        unRegisterTrigger(space: string, tableName: string): Promise<void>;
        isTriggerChanged(space: string, tableName: string, trigger: IRegisterTrigger): boolean;
        setTrigger(dataspace: DataSpace, tableName: string, collist: any[], toDeleteColumns?: string[]): Promise<void>;
    }
}
declare module "packages/worker/web-worker/data-pipeline/LinkRelationUpdater" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    export class LinkRelationUpdater {
        private dataSpace;
        needUpdateCell: Record<string, Record<string, Set<string>>>;
        constructor(dataSpace: DataSpace, setInterval?: typeof global.setInterval);
        updateCells: () => Promise<void>;
        addCell: (tableName: string, tableColumnName: string, rowId: string) => void;
    }
}
declare module "packages/worker/web-worker/data-pipeline/TableFullTextSearch" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    export class TableFullTextSearch {
        private dataspace;
        private enableFTS;
        constructor(dataspace: DataSpace, enableFTS?: boolean);
        createDynamicFTS(tableName: string, temporary?: boolean, inTransaction?: boolean): Promise<void>;
        private createTriggers;
        search(tableName: string, query: string, viewId: string, page?: number, pageSize?: number): Promise<{
            results: {
                row: any;
                matches: any[];
                rowIndex: any;
            }[];
            searchTime: number;
            totalMatches: any;
            currentPage: number;
            totalPages: number;
        }>;
        updateTrigger(tableName: string, toDeleteColumns: string[]): Promise<void>;
        clearFTS(tableName: string): Promise<void>;
        dropFTS(tableName: string): Promise<void>;
        hasFTS(tableName: string): Promise<boolean>;
        rebuildFTS(tableName: string): Promise<void>;
    }
}
declare module "packages/worker/web-worker/data-pipeline/UndoRedo" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    interface StackEntry {
        begin: number;
        end: number;
    }
    interface UndoRedoState {
        active: boolean;
        undostack: StackEntry[];
        redostack: StackEntry[];
        pending?: any;
        firstlog: number;
        freeze?: number;
        startstate?: unknown;
    }
    export class SQLiteUndoRedo {
        undo: UndoRedoState;
        db: DataSpace;
        triggerNames: string[];
        constructor(db: DataSpace);
        activate(tables: string[]): void;
        deactivate(): void;
        freeze(): Promise<void>;
        unfreeze(): void;
        event(): void;
        barrier(): Promise<void>;
        callUndo(): void;
        callRedo(): void;
        refresh(): void;
        reload_all(): void;
        private _makeTriggersForTbl;
        private createTriggers;
        private _drop_triggers;
        private _start_interval;
        private _step;
    }
}
declare module "packages/worker/web-worker/db-migrator/DbMigrator" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    /**
     * auto migrate db schema when db schema changed
     */
    export class DbMigrator {
        private db;
        private draftDb;
        private allowDeletions;
        constructor(db: DataSpace, draftDb: DataSpace, allowDeletions?: boolean);
        private compareTables;
        private compareColumns;
        private migrateTables;
        private migrateTable;
        migrate(): Promise<void>;
        private cleanDraftDb;
    }
}
declare module "packages/worker/web-worker/helper" {
    export function timeit(threshold: number): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
}
declare module "packages/worker/web-worker/import-and-export/base" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    export abstract class BaseImportAndExport {
        abstract import(textFileLike: {
            name: string;
            content: string;
        }, dataSpace: DataSpace): Promise<string>;
        abstract export(nodeId: string, dataSpace: DataSpace): Promise<string>;
    }
}
declare module "packages/worker/web-worker/import-and-export/csv" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    import { BaseImportAndExport } from "packages/worker/web-worker/import-and-export/base";
    export class CsvImportAndExport extends BaseImportAndExport {
        useWal: boolean;
        constructor({ useWal }: {
            useWal?: boolean;
        });
        guessColumnType(content: string): Promise<{
            [name: string]: "String" | "Number" | "Date";
        }>;
        import(file: {
            name: string;
            content: string;
        }, dataSpace: DataSpace): Promise<string>;
        export(nodeId: string, dataSpace: DataSpace): Promise<string>;
    }
}
declare module "packages/worker/web-worker/import-and-export/markdown" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    import { BaseImportAndExport } from "packages/worker/web-worker/import-and-export/base";
    export class MarkdownImportAndExport extends BaseImportAndExport {
        import(file: {
            name: string;
            content: string;
        }, dataSpace: DataSpace): Promise<string>;
        export(nodeId: string, dataSpace: DataSpace): Promise<string>;
    }
}
declare module "packages/worker/web-worker/meta-table/action" {
    import { BaseTable, BaseTableImpl } from "packages/worker/web-worker/meta-table/base";
    type ParamType = "string" | "number" | "boolean";
    interface IFunction {
        name: string;
        params: {
            name: string;
            value: any;
        }[];
    }
    export interface IAction {
        id: string;
        name: string;
        params: {
            name: string;
            type: ParamType;
        }[];
        nodes: IFunction[];
    }
    export class ActionTable extends BaseTableImpl implements BaseTable<IAction> {
        name: string;
        createTableSql: string;
        JSONFields: string[];
        add(data: IAction): Promise<IAction>;
        set(id: string, data: IAction): Promise<boolean>;
        del(id: string): Promise<boolean>;
    }
}
declare module "packages/worker/web-worker/meta-table/chat" {
    import { BaseTable, BaseTableImpl } from "packages/worker/web-worker/meta-table/base";
    export type Chat = {
        id: string;
        created_at: string;
        title: string;
        user_id: string;
        project_id: string;
    };
    export class ChatTable extends BaseTableImpl<Chat> implements BaseTable<Chat> {
        name: string;
        createTableSql: string;
        getChatIdsByProjectId(projectId: string): Promise<string[]>;
        delete(chatId: string): Promise<void>;
    }
}
declare module "packages/worker/web-worker/meta-table/doc" {
    import { Email } from "postal-mime";
    import { MsgType } from "packages/lib/const";
    import { BaseTable, BaseTableImpl } from "packages/worker/web-worker/meta-table/base";
    export interface IDoc {
        id: string;
        content: string;
        markdown: string;
        is_day_page?: boolean;
        created_at?: string;
        updated_at?: string;
    }
    export class DocTable extends BaseTableImpl<IDoc> implements BaseTable<IDoc> {
        name: string;
        createFTSSql: string;
        createTableSql: string;
        /**
         * for now lexical's code node depends on the browser's dom, so we can't use lexical in worker.
         * wait for lexical improve code node to support worker
         * @param type
         * @param data
         * @returns
         */
        callMain: (type: MsgType.GetDocMarkdown | MsgType.ConvertMarkdown2State | MsgType.ConvertHtml2State | MsgType.ConvertEmail2State, data: any) => Promise<any>;
        rebuildIndex(opts: {
            refillNullMarkdown?: boolean;
            recreateFtsTable?: boolean;
        }): Promise<void>;
        listAllDayPages(): Promise<any>;
        listDayPage(page?: number): Promise<any>;
        del(id: string): Promise<boolean>;
        getMarkdown(id: string): Promise<string>;
        getBaseInfo(id: string): Promise<Partial<IDoc>>;
        search(query: string): Promise<{
            id: string;
            result: string;
        }[]>;
        createOrUpdateWithMarkdown(id: string, mdStr: string): Promise<{
            id: string;
            success: boolean;
            msg?: undefined;
        } | {
            id: string;
            success: boolean;
            msg: string;
        }>;
        createOrUpdate(data: {
            id: string;
            text: string | Email;
            type: "html" | "markdown" | "email";
            mode?: "replace" | "append" | "prepend";
        }): Promise<{
            id: string;
            success: boolean;
            msg?: undefined;
        } | {
            id: string;
            success: boolean;
            msg: string;
        }>;
        static mergeState: (oldState: string, newState: string) => string;
        _createOrUpdate(id: string, content: string, markdown: string, mode?: "replace" | "append" | "prepend"): Promise<{
            id: string;
            success: boolean;
            msg?: undefined;
        } | {
            id: string;
            success: boolean;
            msg: string;
        }>;
    }
}
declare module "packages/worker/web-worker/meta-table/message" {
    import { BaseTable, BaseTableImpl } from "packages/worker/web-worker/meta-table/base";
    export type ChatMessage = {
        id: string;
        chat_id: string;
        role: string;
        content: string;
        created_at?: string;
    };
    export class MessageTable extends BaseTableImpl<ChatMessage> implements BaseTable<ChatMessage> {
        name: string;
        createTableSql: string;
        deleteMessagesByChatId(chatId: string): Promise<void>;
        clearMessages(chatId: string): Promise<void>;
    }
}
declare module "packages/worker/web-worker/meta-table/reference" {
    import { IField } from "packages/lib/store/interface";
    import { BaseTable, BaseTableImpl } from "packages/worker/web-worker/meta-table/base";
    export interface IReference {
        self: string;
        ref: string;
        link: string;
        self_table_name: string;
        self_table_column_name: string;
        ref_table_name: string;
        ref_table_column_name: string;
        link_table_name: string;
        link_table_column_name: string;
    }
    /**
     * just for field reference relation, not for link cell
     */
    export class ReferenceTable extends BaseTableImpl implements BaseTable<IReference> {
        del(id: string): Promise<boolean>;
        name: string;
        createTableSql: string;
        getEffectedFields: (table_name: string, table_column_name: string) => Promise<IField[]>;
    }
}
declare module "packages/worker/web-worker/meta-table/tree" {
    import { ITreeNode } from "packages/lib/store/ITreeNode";
    import { BaseTable, BaseTableImpl } from "packages/worker/web-worker/meta-table/base";
    export class TreeTable extends BaseTableImpl implements BaseTable<ITreeNode> {
        name: string;
        createTableSql: string;
        getNextRowId: () => Promise<any>;
        add(data: ITreeNode): Promise<ITreeNode>;
        get(id: string): Promise<ITreeNode | null>;
        updateName(id: string, name: string): Promise<boolean>;
        pin(id: string, is_pinned: boolean): Promise<boolean>;
        del(id: string, db?: import("@/lib/sqlite/interface").BaseServerDatabase): Promise<boolean>;
        makeProxyRow(row: any): ITreeNode;
        query(qs: {
            query?: string;
            withSubNode?: boolean;
        }): Promise<ITreeNode[]>;
        moveIntoTable(id: string, tableId: string, parentId?: string): Promise<boolean>;
        /**
         * id: uuid without '-'
         * miniId: last 8 char of id. most of time, it's enough to identify a node
         * @param idOrMiniId
         */
        getNode(idOrMiniId: string): Promise<ITreeNode | null>;
        checkLoop(id: string, parentId: string): Promise<void>;
        private getAdjacencyList;
        private dfs;
        getPosition(props: {
            parentId?: string;
            targetId: string;
            targetDirection: "up" | "down";
        }): Promise<number>;
    }
}
declare module "packages/worker/web-worker/meta-table/view" {
    import { IView, ViewTypeEnum } from "packages/lib/store/IView";
    import { BaseTable, BaseTableImpl } from "packages/worker/web-worker/meta-table/base";
    export class ViewTable extends BaseTableImpl implements BaseTable<IView> {
        name: string;
        createTableSql: string;
        JSONFields: string[];
        add(data: IView): Promise<IView>;
        del(id: string): Promise<boolean>;
        deleteByTableId(table_id: string, db?: import("@/lib/sqlite/interface").BaseServerDatabase): Promise<void>;
        updateQuery(id: string, query: string): Promise<void>;
        createDefaultView(table_id: string, type?: ViewTypeEnum): Promise<IView<any>>;
        isRowExistInQuery(table_id: string, rowId: string, query: string): Promise<boolean>;
        findRowIndexInQuery(table_id: string, rowId: string, query: string): Promise<number>;
        recompute(table_id: string, rowIds: string[]): Promise<any>;
        private getLastPosition;
        getPosition(props: {
            tableId: string;
            targetId: string;
            targetDirection: "up" | "down";
        }): Promise<number>;
        updatePosition(id: string, position: number): Promise<void>;
        /**
         * Update view position when dragging
         * @param dragId The id of the view being dragged
         * @param targetId The id of the target view
         * @param direction The direction relative to target ("up" | "down")
         * @param tableId The table id that these views belong to
         */
        movePosition(props: {
            dragId: string;
            targetId: string;
            direction: "up" | "down";
            tableId: string;
        }): Promise<void>;
        /**
         * Batch reorder views
         * @param viewIds Array of view ids in desired order (first = highest position)
         */
        reorderViews(viewIds: string[]): Promise<void>;
        private checkAndReorderIfNeeded;
    }
}
declare module "packages/worker/web-worker/udf/index" {
    export const withSqlite3AllUDF: (bc: {
        postMessage: (data: any) => void;
    }) => {
        ALL_UDF: {
            name: string;
            xFunc: (pCx: any, table: any, _new: any, _old: any) => void;
        }[];
        ALL_UDF_NO_CTX: {
            name: string;
            xFunc: (table: any, _new: any, _old: any) => void;
        }[];
    };
}
declare module "packages/worker/web-worker/data-pipeline/TableSemanticSearch" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    export class TableSemanticSearch {
        private readonly dataspace;
        constructor(dataspace: DataSpace);
        search(params: {
            tableName: string;
            query: string;
            viewId?: string;
            fieldId?: string;
            page?: number;
            pageSize?: number;
            method?: 'L2' | 'COSINE';
        }): Promise<{
            meta: {
                embeddingFieldId: string;
                page: number;
                pageSize: number;
            };
            results: any;
        }>;
    }
}
declare module "packages/worker/web-worker/meta-table/extnode" {
    import { BaseTable, BaseTableImpl } from "packages/worker/web-worker/meta-table/base";
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    export interface IExtNode {
        id: string;
        blob?: Buffer;
        text?: string;
        path?: string;
        type: string;
        created_at?: string;
        updated_at?: string;
    }
    export class ExtNodeTable extends BaseTableImpl<IExtNode> implements BaseTable<IExtNode> {
        protected dataSpace: DataSpace;
        name: string;
        createTableSql: string;
        constructor(dataSpace: DataSpace);
        addExtNode(data: Omit<IExtNode, "created_at" | "updated_at">): Promise<IExtNode>;
        updateExtNode(id: string, data: Partial<Omit<IExtNode, "id" | "created_at" | "updated_at">>): Promise<boolean>;
        getExtNodesByType(type: string): Promise<IExtNode[]>;
        getExtNode(id: string): Promise<IExtNode | null>;
        getBlob(id: string): Promise<Buffer | null>;
        getText(id: string): Promise<string | null>;
        getPath(id: string): Promise<string | null>;
        setBlob(id: string, blob: Buffer): Promise<boolean>;
        setPath(id: string, path: string): Promise<boolean>;
        setType(id: string, type: string): Promise<boolean>;
        setText(id: string, text: string): Promise<boolean>;
        deleteExtNode(id: string): Promise<boolean>;
    }
}
declare module "packages/worker/web-worker/DataSpace" {
    import { FieldType } from "packages/lib/fields/const";
    import { EidosFileSystemManager, FileSystemType } from "packages/lib/storage/eidos-file-system";
    import { ITreeNode } from "packages/lib/store/ITreeNode";
    import { IView, ViewTypeEnum } from "packages/lib/store/IView";
    import { IField } from "packages/lib/store/interface";
    import { BaseServerDatabase } from "packages/lib/sqlite/interface";
    import { Email } from "postal-mime";
    import { DataChangeEventHandler } from "packages/worker/web-worker/data-pipeline/DataChangeEventHandler";
    import { DataChangeTrigger } from "packages/worker/web-worker/data-pipeline/DataChangeTrigger";
    import { LinkRelationUpdater } from "packages/worker/web-worker/data-pipeline/LinkRelationUpdater";
    import { TableFullTextSearch } from "packages/worker/web-worker/data-pipeline/TableFullTextSearch";
    import { SQLiteUndoRedo } from "packages/worker/web-worker/data-pipeline/UndoRedo";
    import { ActionTable } from "packages/worker/web-worker/meta-table/action";
    import { BaseTable } from "packages/worker/web-worker/meta-table/base";
    import { ChatTable } from "packages/worker/web-worker/meta-table/chat";
    import { ColumnTable } from "packages/worker/web-worker/meta-table/column";
    import { DocTable } from "packages/worker/web-worker/meta-table/doc";
    import { EmbeddingTable, IEmbedding } from "packages/worker/web-worker/meta-table/embedding";
    import { FileTable, IFile } from "packages/worker/web-worker/meta-table/file";
    import { MessageTable } from "packages/worker/web-worker/meta-table/message";
    import { ReferenceTable } from "packages/worker/web-worker/meta-table/reference";
    import { IExtension, ExtensionStatus, ExtensionTable } from "packages/worker/web-worker/meta-table/extension";
    import { TreeTable } from "packages/worker/web-worker/meta-table/tree";
    import { ViewTable } from "packages/worker/web-worker/meta-table/view";
    import { TableManager } from "packages/worker/web-worker/sdk/table";
    import { TableSemanticSearch } from "packages/worker/web-worker/data-pipeline/TableSemanticSearch";
    import { ExtNodeTable } from "packages/worker/web-worker/meta-table/extnode";
    export type EidosTable = DocTable | ActionTable | ExtensionTable | TreeTable | ViewTable | ColumnTable | EmbeddingTable | FileTable;
    export type EidosDatabase = BaseServerDatabase;
    export class DataSpace {
        db: EidosDatabase;
        draftDb: DataSpace | undefined;
        undoRedoManager: SQLiteUndoRedo;
        activeUndoManager: boolean;
        dbName: string;
        doc: DocTable;
        action: ActionTable;
        script: ExtensionTable;
        extension: ExtensionTable;
        tree: TreeTable;
        view: ViewTable;
        column: ColumnTable;
        reference: ReferenceTable;
        embedding: EmbeddingTable;
        chat: ChatTable;
        message: MessageTable;
        file: FileTable;
        extNode: ExtNodeTable;
        dataChangeTrigger: DataChangeTrigger;
        linkRelationUpdater: LinkRelationUpdater;
        allTables: BaseTable<any>[];
        hasLoadExtension: boolean;
        postMessage?: (data: any, transfer?: any[]) => void;
        callRenderer?: (type: any, data: any) => Promise<any>;
        dataEventChannel: BroadcastChannel;
        eventHandler: DataChangeEventHandler;
        efsManager?: EidosFileSystemManager;
        hasMigrated: boolean;
        tableFullTextSearch: TableFullTextSearch;
        tableSemanticSearch: TableSemanticSearch;
        isUDFWithCtx: boolean;
        context: {
            setInterval?: typeof setInterval;
            embedding?: (text: string) => Promise<Array<number>>;
        };
        constructor(config: {
            db: EidosDatabase;
            activeUndoManager: boolean;
            dbName: string;
            context: {
                setInterval?: typeof setInterval;
                embedding?: (text: string) => Promise<Array<number>>;
            };
            hasLoadExtension?: boolean;
            createUDF?: (db: EidosDatabase) => void;
            draftDb?: DataSpace;
            postMessage?: (data: any, transfer?: any[]) => void;
            callRenderer?: (type: any, data: any) => Promise<any>;
            efsManager?: EidosFileSystemManager;
            dataEventChannel: BroadcastChannel;
            cacheSize?: number;
            isUDFWithCtx?: boolean;
            enableFTS?: boolean;
        });
        semanticSearch: (params: {
            tableName: string;
            query: string;
            viewId?: string;
            fieldId?: string;
            page: number;
            pageSize: number;
        }) => Promise<{
            meta: {
                embeddingFieldId: string;
                page: number;
                pageSize: number;
            };
            results: any;
        }>;
        updateEmbedding: (tableId: string, fieldId: string, data: {
            recordId: string;
            value: string;
        }[]) => Promise<void>;
        queryEmbedding: (tableId: string, fieldId: string, query: string, limit?: number) => Promise<any>;
        getEmbeddingStats: (tableId: string, fieldId: string) => Promise<{
            total: number;
            vectorized: number;
            outdated: number;
            upToDate: number;
            vectorizedPercentage: number;
            outdatedPercentage: number;
            upToDatePercentage: number;
        }>;
        resetEmbedding: (tableId: string, fieldId: string) => Promise<void>;
        status(): Promise<{
            [key: string]: any;
        }>;
        pages(): Promise<{
            [key: string]: any;
        }>;
        pull(): Promise<{
            [key: string]: any;
        }>;
        reset(): Promise<{
            [key: string]: any;
        }>;
        close(): void;
        private setCacheSize;
        private initUDF;
        private initMetaTable;
        getUDFs(): Promise<{
            id: string;
            name: string;
            code: string;
        }[]>;
        onTableChange(space: string, tableName: string, toDeleteColumns?: string[]): Promise<void>;
        addEmbedding(embedding: IEmbedding): Promise<IEmbedding>;
        table(id: string): TableManager;
        createTableIndex(tableId: string, column: string): void;
        getLookupContext(tableName: string, columnName: string): Promise<import("@/lib/fields/lookup").ILookupContext>;
        updateLookupColumn(tableName: string, columnName: string): Promise<void>;
        deleteSelectOption: (field: IField, option: string) => Promise<void>;
        updateSelectOptionName: (field: IField, update: {
            from: string;
            to: string;
        }) => Promise<void>;
        setRow(tableId: string, rowId: string, data: any): Promise<{
            _last_edited_time: string;
            _last_edited_by: string;
            id: string;
        }>;
        setCell(data: {
            tableId: string;
            rowId: string;
            fieldId: string;
            value: any;
        }): Promise<void>;
        getRow(tableId: string, rowId: string): Promise<Record<string, any>>;
        /**
         * Starting from v0.5.0, we switched to using uuidv7 as the _id, and the logic of deleteRowsByRange changed from sorting by rowid to sorting by _id.
         * This function is suitable for old versions of tables where _id of row is uuidv4, and data cannot be deleted by selection, but by a list of _id values.
         * There are some limitations, such as the maximum number of records that can be deleted at once is limited by the sqlite bind parameter.
         * @param rowIds
         * @param tableId
         */
        deleteRowsByIds(ids: string[], tableName: string): Promise<void>;
        deleteRowsByRange(range: {
            startIndex: number;
            endIndex: number;
        }[], tableName: string, query: string): Promise<void>;
        addFile(file: IFile): Promise<IFile>;
        uploadDir(dirHandle: FileSystemDirectoryHandle, _parentPath?: string[]): Promise<void>;
        getFileById(id: string): Promise<IFile>;
        getFileByPath(path: string): Promise<IFile>;
        delFile(id: string): Promise<boolean>;
        delFileByPath(path: string): Promise<boolean>;
        deleteFileByPathPrefix(prefix: string): Promise<boolean>;
        updateFileVectorized(id: string, isVectorized: boolean): Promise<boolean>;
        saveFile2EFS(url: string, subDir?: string[], name?: string): Promise<IFile>;
        listFiles(): Promise<any[]>;
        walkFiles(): Promise<any[]>;
        transformFileSystem(sourceFs: FileSystemType, targetFs: FileSystemType): Promise<void>;
        listViews(tableId: string): Promise<IView[]>;
        addView(view: IView): Promise<IView<any>>;
        delView(viewId: string): Promise<boolean>;
        updateView(viewId: string, view: Partial<IView>): Promise<boolean>;
        createDefaultView(tableId: string, type?: ViewTypeEnum): Promise<IView<any>>;
        isRowExistInQuery(tableId: string, rowId: string, query: string): Promise<boolean>;
        getRecomputeRows(tableId: string, rowIds: string[]): Promise<any>;
        addField(data: IField): Promise<IField>;
        deleteField(tableName: string, tableColumnName: string): Promise<string[]>;
        changeColumnType(tableName: string, columnName: string, type: FieldType): Promise<void>;
        listRawColumns(tableName: string): Promise<{
            [columnName: string]: any;
        }[]>;
        updateColumnProperty(data: {
            tableName: string;
            tableColumnName: string;
            property: any;
            type: FieldType;
        }): Promise<void>;
        addRow(tableName: string, data: Record<string, any>, options?: {
            useFieldId?: boolean;
        }): Promise<Record<string, any>>;
        addAction(data: any): Promise<void>;
        listActions(): Promise<any[]>;
        addExtension(data: IExtension): Promise<void>;
        listScripts(status?: ExtensionStatus): Promise<IExtension[]>;
        getScript(id: string): Promise<IExtension>;
        deleteExtension(id: string): Promise<void>;
        updateExtension(data: IExtension): Promise<void>;
        enableExtension(id: string): Promise<void>;
        disableExtension(id: string): Promise<void>;
        rebuildIndex(refillNullMarkdown?: boolean): Promise<void>;
        rebuildFTS(tableId: string): Promise<void>;
        createExtNode(ext_node_type: string, parent_id?: string): Promise<ITreeNode | null>;
        addDoc(docId: string, content: string, markdown: string, isDayPage?: boolean): Promise<void>;
        getDocBaseInfo(id: string): Promise<Partial<import("@/packages/core/meta-table/doc").IDoc>>;
        updateDoc(docId: string, content: string, markdown: string, _isDayPage?: boolean): Promise<void>;
        getDoc(docId: string): Promise<string>;
        getDocMarkdown(docId: string, { withTitle, }?: {
            withTitle?: boolean;
        }): Promise<string>;
        /**
         * if you want to create or update a day page, you should pass a day page id. page id is like 2021-01-01
         * @param docId
         * @param mdStr
         * @param parent_id
         * @returns
         */
        createOrUpdateDocWithMarkdown(docId: string, mdStr: string, parent_id?: string, title?: string, mode?: "replace" | "append" | "prepend"): Promise<any>;
        createOrUpdateDoc(data: {
            docId: string;
            content: string;
            type: "html" | "markdown" | "email";
            parent_id?: string;
            title?: string;
            mode?: "replace" | "append" | "prepend";
        }): Promise<any>;
        deleteDoc(docId: string): Promise<void>;
        listAllDocIds(): Promise<string[]>;
        fullTextSearch(query: string): Promise<{
            id: string;
            result: string;
        }[]>;
        createTable(fields: Array<{
            name: string;
            type: FieldType;
        }>, name: string): Promise<string>;
        createTableViaSchema(id: string, name: string, tableSchema: string, parent_id?: string): Promise<void>;
        importCsv(file: {
            name: string;
            content: string;
        }): Promise<string>;
        exportCsv(tableId: string): Promise<string>;
        importMarkdown(file: {
            name: string;
            content: string;
        }): Promise<string>;
        exportMarkdown(nodeId: string): Promise<string>;
        fixTable(tableId: string): Promise<void>;
        hasSystemColumn(tableId: string, column: string): Promise<any>;
        restoreNode(id: string): Promise<void>;
        deleteNode(id: string): Promise<void>;
        isTableExist(id: string): Promise<boolean>;
        deleteTable(id: string): Promise<void>;
        listDays(page: number): Promise<any>;
        listAllDays(): Promise<any>;
        syncExec2(sql: string, bind?: any[], db?: BaseServerDatabase): Promise<any>;
        exec2(sql: string, bind?: any[]): Promise<any>;
        runAIgeneratedSQL(sql: string, tableName: string): Promise<Record<string, any>[]>;
        listTreeNodes(query?: string, withSubNode?: boolean): Promise<ITreeNode[]>;
        updateTreeNodePosition(id: string, position: number): Promise<boolean>;
        pinNode(id: string, isPinned: boolean): Promise<boolean>;
        toggleNodeFullWidth(id: string, isFullWidth: boolean): Promise<boolean>;
        toggleNodeLock(id: string, isLocked: boolean): Promise<boolean>;
        updateTreeNodeName(id: string, name: string): Promise<any>;
        addTreeNode(data: ITreeNode): Promise<ITreeNode>;
        getOrCreateTreeNode(data: ITreeNode): Promise<ITreeNode>;
        getTreeNode(id: string): Promise<ITreeNode>;
        moveDraftIntoTable(id: string, tableId: string, parentId?: string): Promise<boolean>;
        nodeChangeParent(id: string, parentId?: string, opts?: {
            targetId: string;
            targetDirection: "up" | "down";
        }): Promise<Partial<ITreeNode>>;
        listUiColumns(tableName: string): Promise<IField[]>;
        /**
         * this will return all ui columns in this space
         * @param tableName
         * @returns
         */
        listAllUiColumns(): Promise<any>;
        undo(): void;
        redo(): void;
        private activeTablesUndoRedo;
        execute(sql: string, bind?: any[]): Promise<{
            fetchone: () => any;
            fetchall: () => any[];
        }>;
        exec(sql: string, bind?: any[]): void;
        private execSqlWithBind;
        /**
         * it's a template string function, to execute sql. safe from sql injection
         * table name and column name need to be Symbol, like Symbol('table_name') or Symbol('column_name')
         *
         * example:
         * const tableName = "books"
         * const id = 42
         * sql`select ${Symbol("title")} from ${Symbol('table_name')} where id = ${id}`.then(logger.info)
         * @param strings
         * @param values
         * @returns
         */
        sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]>;
        sql2: (strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>;
        sqlQuery: (sql: string, bind?: any[], rowMode?: "object" | "array") => Promise<any[]>;
        /**
         * Symbol can't be transformed between main thread and worker thread.
         * so we need to parse sql in main thread, then call this function. it will equal to call `sql` function in worker thread
         * be careful, it just parse sql before, the next logic need to be same with `sql` function
         * @param sql
         * @param bind
         * @returns
         */
        sql4mainThread(sql: string, bind?: any[], rowMode?: "object" | "array"): Promise<any[]>;
        sql4mainThread2(sql: string, bind?: any[]): Promise<any[]>;
        onUpdate(): void;
        notify(msg: {
            title: string;
            description: string;
        }): void;
        blockUIMsg(msg: string | null, data?: Record<string, any>): void;
        /**
         * 往指定邮箱发送邮件时，会被 cloudflare worker 拦截，
         * worker 再转发到 api-agent，最后 api-agent 调用 currentSpace.email() 方法
         * @param email
         */
        email(email: Email): void;
        createTableFTS(tableName: string, temporary?: boolean): Promise<void>;
        searchTableFTS(tableName: string, query: string, viewId: string, page?: number, pageSize?: number): Promise<{
            results: {
                row: any;
                matches: any[];
                rowIndex: any;
            }[];
            searchTime: number;
            totalMatches: any;
            currentPage: number;
            totalPages: number;
        }>;
        hasTableFTS(tableName: string): Promise<boolean>;
    }
}
declare module "@eidos.space/types" {
    import { DataSpace } from "packages/worker/web-worker/DataSpace";
    export interface Eidos {
        space(spaceName: string): DataSpace;
        currentSpace: DataSpace;
        /**
         * Script functionality
         */
        script: {
            /**
             * Call a specific script
             * @param scriptId The script ID
             * @param args Arguments to pass to the script
             * @returns The result of the script execution
             */
            call(scriptId: string, ...args: any[]): Promise<any>;
        };
        /**
         * AI-related functionality
         */
        AI: {
            /**
             * Generate text using AI
             * @param options Generation options including model and prompt
             * @param options.model The AI model to use
             * @param options.prompt The prompt text
             * @returns The generated text
             */
            generateText(options: {
                model?: string;
                prompt: string;
                [key: string]: any;
            }): Promise<string>;
        };
        utils: {
            /**
             * we can't use fetch directly in the iframe, so we need to use this method to fetch resource
             * Note: it return Blob, not Response
             *
             * for example:
             *
             * const blob = await eidos.fetchBlob("https://example.com/file.zip", {
             *   method: "GET",
             *   headers: {
             *     "Content-Type": "application/zip",
             *   },
             * })
             *
             * @param url
             * @param options
             * @returns
             */
            fetchBlob(url: string, options: RequestInit): Promise<Blob>;
            /**
             * highlight the row if it is in the current view
             * @param tableId
             * @param rowId
             * @param fieldId
             */
            tableHighlightRow(tableId: string, rowId: string, fieldId?: string): void;
        };
    }
    export interface EidosTable<T = Record<string, string>> {
        id: string;
        name: string;
        fieldsMap: T;
    }
}
