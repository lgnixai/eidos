import { BaseTable, BaseTableImpl } from "./base"
import { ChatTableName, MessageTableName } from "@/lib/sqlite/const"
import { createTriggersForFields } from "@/lib/sqlite/sql-meta-table-trigger"


export type ChatMessage = {
  id: string
  chat_id: string
  role: string
  content: string
  created_at?: string
}

export class MessageTable extends BaseTableImpl<ChatMessage> implements BaseTable<ChatMessage> {
  name = MessageTableName
  createTableSql = `
  CREATE TABLE IF NOT EXISTS ${MessageTableName} (
    id TEXT PRIMARY KEY,
    chat_id TEXT,
    role TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(chat_id) REFERENCES ${ChatTableName}(id)
  );

  ${createTriggersForFields(MessageTableName, [
    'id', 'chat_id', 'role', 'content', 'created_at'
  ])}
  `

  async deleteMessagesByChatId(chatId: string) {
    const sql = `DELETE FROM ${this.name} WHERE chat_id = ?`;
    await this.dataSpace.exec2(sql, [chatId]);
  }

  async clearMessages(chatId: string) {
    const sql = `DELETE FROM ${this.name} WHERE chat_id = ?`;
    await this.dataSpace.exec2(sql, [chatId]);
  }
}
