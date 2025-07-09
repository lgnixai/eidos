import { ScriptTableName } from "../sqlite/const";
import { createUpdateTriggerForFields } from "../sqlite/sql-meta-table-trigger";
import type {
  ExtensionStatus,
  IExtension,
  TableViewMeta,
} from "../types/IExtension";

import type { BaseTable } from "./base";
import { BaseTableImpl } from "./base";

// Re-export types for backward compatibility
export type { ExtensionStatus, IExtension, TableViewMeta };



export class ExtensionTable
  extends BaseTableImpl<IExtension>
  implements BaseTable<IExtension> {
  name = ScriptTableName
  createTableSql = `
    CREATE TABLE IF NOT EXISTS ${this.name} (
        id TEXT PRIMARY KEY,
        slug TEXT,
        name TEXT,
        description TEXT,
        type TEXT DEFAULT 'script',
        version TEXT,
        code TEXT,
        ts_code TEXT,
        meta TEXT,
        icon TEXT,
        marketplace_id TEXT,
        enabled BOOLEAN DEFAULT 0,
        bindings TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ${createUpdateTriggerForFields(this.name, [
    'id', 'slug', 'name', 'type', 'code', 'enabled', 'icon'
  ])}

`

  JSONFields: string[] = [
    "meta",
    "bindings",
  ]

  async getTableViews(): Promise<IExtension<TableViewMeta>[]> {
    const sql = `
      SELECT id, slug, name, description, type, version, meta, icon, marketplace_id, enabled, bindings, created_at, updated_at FROM ${this.name}
      WHERE enabled = 1
      AND meta IS NOT NULL
      AND meta != ''
      AND JSON_VALID(meta) = 1
      AND JSON_EXTRACT(meta, '$.type') = 'tableView'
    `
    const res = await this.dataSpace.exec2(sql)
    return res.map((item: any) => this.toJson(item))
  }

  async getTableViewExtensionInfoByExtType(viewType: string): Promise<IExtension<TableViewMeta>[]> {
    const sql = `
      SELECT id, slug, name, description, type, version, meta, icon, marketplace_id, enabled, bindings, created_at, updated_at FROM ${this.name}
      WHERE enabled = 1
      AND meta IS NOT NULL
      AND meta != ''
      AND JSON_VALID(meta) = 1
      AND JSON_EXTRACT(meta, '$.tableView.type') = ?
    `
    const res = await this.dataSpace.exec2(sql, [viewType])
    return res.map((item: any) => this.toJson(item))
  }

  async getTableViewsInfo(): Promise<IExtension<TableViewMeta>[]> {
    const sql = `
      SELECT id, slug, name, description, type, version, meta, icon, marketplace_id, enabled, bindings, created_at, updated_at FROM ${this.name}
      WHERE enabled = 1
      AND meta IS NOT NULL
      AND meta != ''
      AND JSON_VALID(meta) = 1
      AND JSON_EXTRACT(meta, '$.type') = 'tableView'
    `
    const res = await this.dataSpace.exec2(sql)
    return res.map((item: any) => this.toJson(item))
  }

  async del(id: string): Promise<boolean> {
    await this.dataSpace.db.transaction(async () => {
      await this.dataSpace.exec2(`DELETE FROM ${this.name} WHERE id = ?`, [id])
      const chatIds = await this.dataSpace.chat.getChatIdsByProjectId(id)
      await Promise.all(chatIds.map(chatId => this.dataSpace.chat.del(chatId)))
    })
    return true
  }

  async enable(id: string): Promise<boolean> {
    this.dataSpace.exec2(`UPDATE ${this.name} SET enabled = 1 WHERE id = ?`, [
      id,
    ])
    return Promise.resolve(true)
  }

  async disable(id: string): Promise<boolean> {
    this.dataSpace.exec2(`UPDATE ${this.name} SET enabled = 0 WHERE id = ?`, [
      id,
    ])
    return Promise.resolve(true)
  }

  async updateBindings(id: string, bindings: Record<string, { type: string; value: string }>) {
    this.dataSpace.exec2(`UPDATE ${this.name} SET bindings = ? WHERE id = ?`, [
      JSON.stringify(bindings),
      id,
    ])
    return Promise.resolve(true)
  }

  // ========== Block Extension Query Methods ==========

  /**
   * Get all block extensions by status
   */
  async getBlockExtensions(status: ExtensionStatus = "enabled"): Promise<IExtension[]> {
    const params: any[] = ['block']
    let sql = `SELECT * FROM ${this.name} WHERE type = ?`

    if (status === "enabled") {
      sql += " AND enabled = ?"
      params.push(1)
    } else if (status === "disabled") {
      sql += " AND enabled = ?"
      params.push(0)
    }
    // status === "all" - no additional filter needed

    const res = await this.dataSpace.exec2(sql, params)
    return res.map((item: any) => this.toJson(item))
  }

  /**
   * Get ExtNode extensions by status
   */
  async getExtNodeExtensions(status: ExtensionStatus = "enabled"): Promise<IExtension[]> {
    const params: any[] = ['block', 'extNode']
    let sql = `
      SELECT * FROM ${this.name}
      WHERE type = ?
      AND meta IS NOT NULL
      AND meta != ''
      AND JSON_VALID(meta) = 1
      AND JSON_EXTRACT(meta, '$.type') = ?
    `

    if (status === "enabled") {
      sql += " AND enabled = ?"
      params.push(1)
    } else if (status === "disabled") {
      sql += " AND enabled = ?"
      params.push(0)
    }

    const res = await this.dataSpace.exec2(sql, params)
    return res.map((item: any) => this.toJson(item))
  }

  /**
   * Get ExtNode extensions by handler type
   */
  async getExtNodeExtensionsByHandler(handler: string, status: ExtensionStatus = "enabled"): Promise<IExtension[]> {
    const params: any[] = ['block', 'extNode', `%"${handler}"%`]
    let sql = `
      SELECT * FROM ${this.name}
      WHERE type = ?
      AND meta IS NOT NULL
      AND meta != ''
      AND JSON_VALID(meta) = 1
      AND JSON_EXTRACT(meta, '$.type') = ?
      AND JSON_EXTRACT(meta, '$.extNode.extHandler') LIKE ?
    `

    if (status === "enabled") {
      sql += " AND enabled = ?"
      params.push(1)
    } else if (status === "disabled") {
      sql += " AND enabled = ?"
      params.push(0)
    }

    const res = await this.dataSpace.exec2(sql, params)
    return res.map((item: any) => this.toJson(item))
  }

  // ========== Script Extension Query Methods ==========

  /**
   * Get all script extensions by status
   */
  async getScriptExtensions(status: ExtensionStatus = "enabled"): Promise<IExtension[]> {
    const params: any[] = ['script']
    let sql = `SELECT * FROM ${this.name} WHERE type = ?`

    if (status === "enabled") {
      sql += " AND enabled = ?"
      params.push(1)
    } else if (status === "disabled") {
      sql += " AND enabled = ?"
      params.push(0)
    }

    const res = await this.dataSpace.exec2(sql, params)
    return res.map((item: any) => this.toJson(item))
  }

  /**
   * Get Tool extensions by status
   */
  async getToolExtensions(status: ExtensionStatus = "enabled"): Promise<IExtension[]> {
    const params: any[] = ['script', 'tool']
    let sql = `
      SELECT * FROM ${this.name}
      WHERE type = ?
      AND meta IS NOT NULL
      AND meta != ''
      AND JSON_VALID(meta) = 1
      AND JSON_EXTRACT(meta, '$.type') = ?
    `

    if (status === "enabled") {
      sql += " AND enabled = ?"
      params.push(1)
    } else if (status === "disabled") {
      sql += " AND enabled = ?"
      params.push(0)
    }

    const res = await this.dataSpace.exec2(sql, params)
    return res.map((item: any) => this.toJson(item))
  }

  /**
   * Get TableAction extensions by status
   */
  async getTableActionExtensions(status: ExtensionStatus = "enabled"): Promise<IExtension[]> {
    const params: any[] = ['script', 'tableAction']
    let sql = `
      SELECT * FROM ${this.name}
      WHERE type = ?
      AND meta IS NOT NULL
      AND meta != ''
      AND JSON_VALID(meta) = 1
      AND JSON_EXTRACT(meta, '$.type') = ?
    `

    if (status === "enabled") {
      sql += " AND enabled = ?"
      params.push(1)
    } else if (status === "disabled") {
      sql += " AND enabled = ?"
      params.push(0)
    }

    const res = await this.dataSpace.exec2(sql, params)
    return res.map((item: any) => this.toJson(item))
  }

  /**
   * Get UDF (User Defined Function) extensions by status
   */
  async getUDFExtensions(status: ExtensionStatus = "enabled"): Promise<IExtension[]> {
    const params: any[] = ['script', 'udf']
    let sql = `
      SELECT * FROM ${this.name}
      WHERE type = ?
      AND meta IS NOT NULL
      AND meta != ''
      AND JSON_VALID(meta) = 1
      AND JSON_EXTRACT(meta, '$.type') = ?
    `

    if (status === "enabled") {
      sql += " AND enabled = ?"
      params.push(1)
    } else if (status === "disabled") {
      sql += " AND enabled = ?"
      params.push(0)
    }

    const res = await this.dataSpace.exec2(sql, params)
    return res.map((item: any) => this.toJson(item))
  }

  // ========== General Query Methods ==========

  /**
   * Get extension by slug
   */
  async getExtensionBySlug(slug: string): Promise<IExtension | null> {
    const sql = `SELECT * FROM ${this.name} WHERE slug = ?`
    const res = await this.dataSpace.exec2(sql, [slug])
    return res.length > 0 ? this.toJson(res[0]) : null
  }

  /**
   * Get extensions by marketplace ID
   */
  async getExtensionsByMarketplaceId(marketplaceId: string): Promise<IExtension[]> {
    const sql = `SELECT * FROM ${this.name} WHERE marketplace_id = ?`
    const res = await this.dataSpace.exec2(sql, [marketplaceId])
    return res.map((item: any) => this.toJson(item))
  }

  /**
   * Get extensions by type and status
   */
  async getExtensionsByType(type: "script" | "block", status: ExtensionStatus = "enabled"): Promise<IExtension[]> {
    const params: any[] = [type]
    let sql = `SELECT * FROM ${this.name} WHERE type = ?`

    if (status === "enabled") {
      sql += " AND enabled = ?"
      params.push(1)
    } else if (status === "disabled") {
      sql += " AND enabled = ?"
      params.push(0)
    }

    const res = await this.dataSpace.exec2(sql, params)
    return res.map((item: any) => this.toJson(item))
  }

  /**
   * Search extensions by name or description
   */
  async searchExtensions(query: string, status: ExtensionStatus = "all"): Promise<IExtension[]> {
    const searchPattern = `%${query}%`
    const params: any[] = [searchPattern, searchPattern]
    let sql = `SELECT * FROM ${this.name} WHERE (name LIKE ? OR description LIKE ?)`

    if (status === "enabled") {
      sql += " AND enabled = ?"
      params.push(1)
    } else if (status === "disabled") {
      sql += " AND enabled = ?"
      params.push(0)
    }

    const res = await this.dataSpace.exec2(sql, params)
    return res.map((item: any) => this.toJson(item))
  }

  /**
   * Get extensions with bindings
   */
  async getExtensionsWithBindings(status: ExtensionStatus = "enabled"): Promise<IExtension[]> {
    const params: any[] = []
    let sql = `SELECT * FROM ${this.name} WHERE bindings IS NOT NULL AND bindings != '' AND bindings != '{}'`

    if (status === "enabled") {
      sql += " AND enabled = ?"
      params.push(1)
    } else if (status === "disabled") {
      sql += " AND enabled = ?"
      params.push(0)
    }

    const res = await this.dataSpace.exec2(sql, params)
    return res.map((item: any) => this.toJson(item))
  }

  /**
   * Get extension count by type and status
   */
  async getExtensionCount(type?: "script" | "block", status: ExtensionStatus = "all"): Promise<number> {
    const params: any[] = []
    let sql = `SELECT COUNT(*) as count FROM ${this.name} WHERE 1=1`

    if (type) {
      sql += " AND type = ?"
      params.push(type)
    }

    if (status === "enabled") {
      sql += " AND enabled = ?"
      params.push(1)
    } else if (status === "disabled") {
      sql += " AND enabled = ?"
      params.push(0)
    }

    const res = await this.dataSpace.exec2(sql, params)
    return res[0]?.count || 0
  }
}
