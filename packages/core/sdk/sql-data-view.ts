import { ViewTypeEnum } from "@/lib/store/IView"
import { DataSpace } from "../DataSpace"
import { shortenId, uuidv7 } from "@/lib/utils"
import { IField } from "@/lib/store/interface"
import { FieldType } from "@/lib/fields/const"

export class SqlDataView {
    constructor(private dataSpace: DataSpace) {
    }

    async isDataViewExist(id: string) {
        const viewName = `vw_${id}`
        const view = await this.dataSpace.db.exec({
            sql: `SELECT name, sql FROM sqlite_master WHERE type='view' and name = ?;`,
            bind: [viewName]
        })
        return view.length > 0
    }

    async getViewRawQuery(tableName: string) {
        const view = await this.dataSpace.db.exec({
            sql: `SELECT sql FROM sqlite_master WHERE type='view' and name = ?;`,
            bind: [tableName]
        })
        return view[0].sql
    }

    async getViewColumns(id: string) {
        const viewName = `vw_${id}`
        const columns = await this.dataSpace.db.prepare(`PRAGMA table_info(${viewName});`).all()
        return columns
    }

    async getViewFields(id: string): Promise<IField[]> {
        const viewName = `vw_${id}`
        const columns = await this.getViewColumns(id)
        const modifiedColumns = await this.dataSpace.column.list({ table_name: viewName })
        return columns.map((column) => {
            const modifiedColumn = modifiedColumns.find((c) => c.table_column_name === column.name)
            if (modifiedColumn) {
                return modifiedColumn
            }
            return {
                name: column.name,
                type: FieldType.Text,
                table_column_name: column.name,
                table_name: viewName,
                property: {},
            }
        })
    }

    async updateViewColumn({
        tableName,
        tableColumnName,
        type,
        property,
    }: {
        tableName: string
        tableColumnName: string
        type: FieldType
        property: any
    }) {

        const updateData = {
            name: tableColumnName,
            type,
            table_name: tableName,
            table_column_name: tableColumnName,
            property: property,
        }
        const column = await this.dataSpace.column.getColumn(tableName, tableColumnName)
        if (!column) {
            await this.dataSpace.column.addPureUIColumn(updateData)
        } else {
            await this.dataSpace.column.updatePureUIColumn(updateData)
        }
    }

    async createDataView(id: string, createViewSql: string) {
        const viewName = `vw_${id}`
        await this.dataSpace.db.prepare('BEGIN TRANSACTION;').run()

        try {
            await this.dataSpace.db.prepare(`CREATE VIEW IF NOT EXISTS ${viewName} AS ${createViewSql};`).run();
            await this.dataSpace.view.add({
                id: shortenId(uuidv7()),
                name: `New View`,
                type: ViewTypeEnum.Grid,
                table_id: id,
                query: `select * from ${viewName}`,
            })
        } catch (error) {
            await this.dataSpace.db.prepare('ROLLBACK;').run()
            console.error('Error in createDataView transaction:', error)
            throw error
        } finally {
            await this.dataSpace.db.prepare('COMMIT;').run()
        }
        return true
    }
}