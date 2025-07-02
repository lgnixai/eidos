import { ScriptTableName } from "@/packages/core/sqlite/const"
import { createUpdateTriggerForFields } from "@/packages/core/sqlite/sql-meta-table-trigger"
import type {
  IExtension,
  TableViewInfo,
  ExtensionStatus,
  ICommand,
  IPromptConfig
} from "@/packages/core/types/IExtension"

import type { BaseTable } from "./base";
import { BaseTableImpl } from "./base"

// Re-export types for backward compatibility
export type { IExtension, TableViewInfo, ExtensionStatus, ICommand, IPromptConfig }

export class ExtensionTable
  extends BaseTableImpl<IExtension>
  implements BaseTable<IExtension> {
  name = ScriptTableName
  createTableSql = `
    CREATE TABLE IF NOT EXISTS ${this.name} (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        type TEXT DEFAULT 'script',
        ext_node_type TEXT,
        ext_node_handle_block_id TEXT,
        version TEXT,
        code TEXT,
        ts_code TEXT,
        meta TEXT,
        icon TEXT,
        marketplace_id TEXT,
        model TEXT,
        prompt_config TEXT,
        commands TEXT,
        tables TEXT,
        envs TEXT,
        env_map TEXT,
        fields_map TEXT,
        enabled BOOLEAN DEFAULT 0,
        bindings TEXT,
        dependencies TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ${createUpdateTriggerForFields(this.name, [
    'id', 'type', 'name', 'code', 'enabled', 'ext_node_type', 'ext_node_handle_block_id', 'icon'
  ])}

`

  JSONFields: string[] = [
    "commands",
    "tables",
    "envs",
    "env_map",
    "fields_map",
    "prompt_config",
    "bindings",
    "dependencies",
    "meta",
  ]

  async getTableViews(): Promise<IExtension[]> {
    const sql = `
      SELECT * FROM ${this.name} 
      WHERE enabled = 1 
      AND meta IS NOT NULL 
      AND meta != ''
      AND JSON_VALID(meta) = 1
      AND JSON_EXTRACT(meta, '$.type') = 'tableView'
    `
    const res = await this.dataSpace.exec2(sql)
    return res.map((item: any) => this.toJson(item))
  }

  async getTableViewExtensionInfoByExtType(viewType: string): Promise<IExtension[]> {
    const sql = `
      SELECT * FROM ${this.name} 
      WHERE enabled = 1 
      AND meta IS NOT NULL 
      AND meta != ''
      AND JSON_VALID(meta) = 1
      AND JSON_EXTRACT(meta, '$.tableView.type') = ?
    `
    const res = await this.dataSpace.exec2(sql, [viewType])
    return res.map((item: any) => this.toJson(item))
  }

  async getTableViewsInfo(): Promise<TableViewInfo[]> {
    const sql = `
      SELECT 
        id,
        description,
        CASE
          WHEN meta IS NOT NULL AND meta != '' AND JSON_VALID(meta) = 1 
          THEN JSON_EXTRACT(meta, '$.tableView.type')
          ELSE NULL 
        END as type,
        CASE 
          WHEN meta IS NOT NULL AND meta != '' AND JSON_VALID(meta) = 1 
          THEN JSON_EXTRACT(meta, '$.tableView.title') 
          ELSE NULL 
        END as title
      FROM ${this.name} 
      WHERE enabled = 1 
      AND meta IS NOT NULL 
      AND meta != ''
      AND JSON_VALID(meta) = 1
      AND JSON_EXTRACT(meta, '$.type') = 'tableView'
    `
    const res = await this.dataSpace.exec2(sql)
    return res.map((row: any) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      description: row.description,
    }))
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

  async updateEnvMap(id: string, env_map: { [key: string]: string }) {
    this.dataSpace.exec2(`UPDATE ${this.name} SET env_map = ? WHERE id = ?`, [
      JSON.stringify(env_map),
      id,
    ])
    return Promise.resolve(true)
  }
}
