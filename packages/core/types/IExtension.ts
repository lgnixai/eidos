import type { JsonSchema7ObjectType } from "zod-to-json-schema"

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

export interface TableViewInfo {
    id: string
    type: string
    title: string
    description: string
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