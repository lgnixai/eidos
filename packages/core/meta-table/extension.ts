import { JsonSchema7ObjectType } from "zod-to-json-schema"

import { ScriptTableName } from "@/packages/core/sqlite/const"
import { createUpdateTriggerForFields } from "@/packages/core/sqlite/sql-meta-table-trigger"

import { BaseTable, BaseTableImpl } from "./base"

export type ExtensionStatus = "all" | "enabled" | "disabled"

export interface ICommand {
  name: string
  description: string
  inputJSONSchema?: JsonSchema7ObjectType
  outputJSONSchema?: JsonSchema7ObjectType
  asTableAction?: boolean
  asTool?: boolean
}

export interface IPromptConfig {
  model?: string
  actions?: string[]
}


// aka extension
export interface IExtension {
  id: string
  name: string
  // block is static code stored in local file system
  // m_block is mini or macro block, just a piece of code snippet stored in database
  type: "script" | "udf" | "prompt" | "block" | "app" | "m_block" | "doc_plugin" | "py_script" | "ext_node"
  // ext_node_type is the type of the ext_node
  ext_node_type?: string
  // block used to handle the ext_node
  ext_node_handle_block_id?: string
  description: string
  version: string
  code: string
  meta?: Record<string, any>
  // icon is a data uri of an image
  icon?: string
  // if the script is published to marketplace, it will have a marketplace_id
  marketplace_id?: string
  ts_code?: string
  enabled?: boolean
  // for prompt
  model?: string
  prompt_config?: IPromptConfig
  // for script
  commands: ICommand[]
  tables?: {
    name: string
    fields: {
      name: string
      type: string
    }[]
  }[]
  envs?: {
    name: string
    type: string
    readonly?: boolean
  }[]
  env_map?: {
    [key: string]: string
  }
  fields_map?: {
    [tableName: string]: {
      id: string
      name: string
      fieldsMap: {
        [fieldName: string]: string
      }
    }
  }
  // FIXME: there are too many fields in this table, we need to refactor it
  bindings?: Record<string, {
    type: 'table'
    value: string
  }>
  // for py_script
  dependencies?: string[]
}

export class ExtensionTable
  extends BaseTableImpl<IExtension>
  implements BaseTable<IExtension>
{
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
