import type { Email } from "postal-mime"

import { MsgType } from "@/lib/const"
import { DocTableName } from "../sqlite/const"

import type { BaseTable} from "./base";
import { BaseTableImpl } from "./base"

/**
 * Utility function to escape FTS queries safely
 * @param query Raw user input query
 * @param allowAdvanced Whether to allow advanced FTS syntax
 * @returns Escaped query safe for FTS
 */
export function escapeFTSQuery(query: string, allowAdvanced: boolean = false): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  const trimmedQuery = query.trim();

  // Check if query looks like it contains intentional FTS syntax
  const looksAdvanced = /^["'].*["']$/.test(trimmedQuery) || // Quoted phrases
    /\b(AND|OR|NOT|NEAR)\b/i.test(trimmedQuery) || // Boolean operators
    /\*/.test(trimmedQuery) || // Wildcards
    /^\+/.test(trimmedQuery); // Prefix search

  // If advanced syntax is allowed and query looks intentional
  if (allowAdvanced && looksAdvanced) {
    // Only escape unmatched quotes and basic cleanup
    return trimmedQuery
      .replace(/"/g, (match, offset, string) => {
        // Count quotes before this position
        const beforeQuotes = (string.substring(0, offset).match(/"/g) || []).length;
        // If odd number of quotes before, this might be unmatched
        return beforeQuotes % 2 === 0 ? '"' : '';
      })
      .replace(/\s+/g, ' ')
      .trim();
  }

  // For regular user input, wrap in quotes for exact phrase matching
  // This allows searching for special characters like brackets safely
  // Escape any existing quotes in the content first
  const escaped = trimmedQuery.replace(/"/g, '""');

  // Wrap the entire query in quotes for exact phrase matching
  return `"${escaped}"`;
}

export interface IDoc {
  id: string
  content: string
  markdown: string
  is_day_page?: boolean
  created_at?: string
  updated_at?: string
}


export class DocTable extends BaseTableImpl<IDoc> implements BaseTable<IDoc> {
  name = DocTableName
  createFTSSql = this.dataSpace.hasLoadExtension ? `
  CREATE VIRTUAL TABLE IF NOT EXISTS fts_docs USING fts5(id,markdown, content='${this.name}',tokenize = 'simple');
  `: `CREATE VIRTUAL TABLE IF NOT EXISTS fts_docs USING fts5(id,markdown, content='${this.name}');`
  createTableSql = `
  CREATE TABLE IF NOT EXISTS ${this.name} (
    id TEXT PRIMARY KEY,
    content TEXT,
    is_day_page BOOLEAN DEFAULT 0,
    markdown TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );


  CREATE TRIGGER IF NOT EXISTS update_time_trigger__${this.name}
  AFTER UPDATE ON ${this.name}
  FOR EACH ROW
  BEGIN
    UPDATE ${this.name} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
    ${this.createFTSSql}    
  CREATE TEMP TRIGGER IF NOT EXISTS ${this.name}_ai AFTER INSERT ON ${this.name} BEGIN
    INSERT INTO fts_docs(rowid,id, markdown) VALUES (new.rowid, new.id, new.markdown);
  END;

  CREATE TEMP TRIGGER IF NOT EXISTS ${this.name}_ad AFTER DELETE ON ${this.name} BEGIN
    INSERT INTO fts_docs(fts_docs, rowid, id,markdown) VALUES('delete', old.rowid, old.id, old.markdown);
  END;
  
  CREATE TEMP TRIGGER IF NOT EXISTS ${this.name}_au AFTER UPDATE ON ${this.name} BEGIN
    INSERT INTO fts_docs(fts_docs, rowid, id, markdown) VALUES('delete', old.rowid, old.id, old.markdown);
    INSERT INTO fts_docs(rowid, id, markdown) VALUES (new.rowid, new.id, new.markdown);
  END;
`

  /**
   * for now lexical's code node depends on the browser's dom, so we can't use lexical in worker.
   * wait for lexical improve code node to support worker
   * @param type
   * @param data
   * @returns
   */
  callMain = (
    type:
      | MsgType.GetDocMarkdown
      | MsgType.ConvertMarkdown2State
      | MsgType.ConvertHtml2State
      | MsgType.ConvertEmail2State,
    data: any
  ) => {
    return this.dataSpace.callRenderer?.(type, data)
  }

  async rebuildIndex(opts: {
    refillNullMarkdown?: boolean;
    recreateFtsTable?: boolean;
  }) {
    const { refillNullMarkdown, recreateFtsTable } = opts;

    if (recreateFtsTable) {
      // Drop triggers first
      await this.dataSpace.db.exec(`
        DROP TRIGGER IF EXISTS ${this.name}_ai;
        DROP TRIGGER IF EXISTS ${this.name}_ad;
        DROP TRIGGER IF EXISTS ${this.name}_au;
      `);
      // Then drop the FTS table
      await this.dataSpace.exec2(`DROP TABLE IF EXISTS fts_docs;`);
      // Recreate the FTS table
      await this.dataSpace.exec2(this.createFTSSql);
      console.log(`Recreated fts_docs table and triggers for ${this.dataSpace.dbName}`);
    }

    await this.dataSpace.exec2(
      `INSERT INTO fts_docs(fts_docs) VALUES('rebuild');`
    )
    if (refillNullMarkdown) {
      const res = await this.dataSpace.exec2(
        `SELECT id, markdown FROM ${this.name}`
      )
      for (const item of res) {
        if (item.markdown == null) {
          const markdown = await this.getMarkdown(item.id)
          try {
            await this.dataSpace.exec2(
              `UPDATE ${this.name} SET markdown = ? WHERE id = ?`,
              [markdown, item.id]
            )
            console.log(`update ${item.id} markdown`)
          } catch (error) {
            console.warn(`update ${item.id} markdown error`, error)
          }
        }
      }
    }
    await this.dataSpace.exec2(
      `INSERT INTO fts_docs(fts_docs) VALUES('rebuild');`
    )
    console.log(`rebuild ${this.dataSpace.dbName} index`)
  }
  async listAllDayPages() {
    const res = await this.dataSpace.exec2(
      `SELECT id FROM ${this.name} WHERE is_day_page = 1 AND markdown != '' ORDER BY id DESC`
    )
    return res.map((item: any) => ({
      id: item.id,
    }))
  }

  async listDayPage(page: number = 0) {
    const pageSize = 7
    const res = await this.dataSpace.exec2(
      `SELECT id FROM ${this.name} WHERE is_day_page = 1 ORDER BY id DESC LIMIT ?,?`,
      [page * pageSize, pageSize]
    )
    return res.map((item: any) => ({
      id: item.id,
    }))
  }

  async del(id: string) {
    this.dataSpace.exec(`DELETE FROM ${this.name} WHERE id = ?`, [id])
    return true
  }

  async getMarkdown(id: string): Promise<string> {
    const doc = await this.get(id)
    return doc?.markdown || ""
    // const res = await callMain(MsgType.GetDocMarkdown, doc?.content)
    // return res as string
  }

  async getBaseInfo(id: string): Promise<Partial<IDoc>> {
    const res = await this.dataSpace.exec2(
      `SELECT id, created_at, updated_at FROM ${this.name} WHERE id = ?`,
      [id]
    )
    return res[0]
  }

  /**
   * Search documents using full-text search with progressive query processing
   * 
   * @param query The search query string
   * @param options Optional search configuration (kept for backward compatibility)
   * @returns Array of search results with document ID and highlighted snippets
   * 
   * @example
   * // Basic search
   * const results = await docTable.search('hello world');
   * 
   * // Advanced FTS syntax (automatically detected and handled)
   * const results = await docTable.search('"exact phrase" AND keyword*');
   */
  async search(query: string, options?: { allowAdvanced?: boolean }): Promise<{ id: string; result: string }[]> {
    if (!query || typeof query !== 'string') {
      return [];
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }

    // First try: Use the original query directly (supports advanced FTS syntax)
    try {
      const res = await this.dataSpace.exec2(
        `SELECT id, snippet(fts_docs, 1, '<b>', '</b>','...',127) as result FROM fts_docs WHERE fts_docs MATCH ?;`,
        [trimmedQuery]
      );

      // If we found results with original query, return them
      if (res.length > 0) {
        return res.reverse();
      }
    } catch (error) {
      console.log('Original query failed, trying escaped version:', error instanceof Error ? error.message : String(error));
    }

    // Second try: Use safe escaping (exact phrase match)
    try {
      const escapedQuery = escapeFTSQuery(trimmedQuery, false);
      if (escapedQuery && escapedQuery !== trimmedQuery) {
        const res = await this.dataSpace.exec2(
          `SELECT id, snippet(fts_docs, 1, '<b>', '</b>','...',127) as result FROM fts_docs WHERE fts_docs MATCH ?;`,
          [escapedQuery]
        );

        if (res.length > 0) {
          return res.reverse();
        }
      }
    } catch (error) {
      console.log('Escaped query also failed:', error instanceof Error ? error.message : String(error));
    }

    // Third try: If query contains special chars, try a more permissive search by tokenizing
    if (/[\[\]\(\)\-\+\*\&\|\!\@\#\$\%\^\~]/.test(trimmedQuery)) {
      try {
        // Remove special characters and search for individual words
        const cleanQuery = trimmedQuery
          .replace(/[\[\]\(\)\-\+\*\&\|\!\@\#\$\%\^\~]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanQuery) {
          console.log('Trying permissive search with:', cleanQuery);
          const fallbackRes = await this.dataSpace.exec2(
            `SELECT id, snippet(fts_docs, 1, '<b>', '</b>','...',127) as result FROM fts_docs WHERE fts_docs MATCH ?;`,
            [cleanQuery]
          );
          return fallbackRes.reverse();
        }
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
      }
    }

    // If all searches fail, return empty results instead of throwing
    return [];
  }

  async createOrUpdateWithMarkdown(id: string, mdStr: string) {
    const content = (await this.callMain(
      MsgType.ConvertMarkdown2State,
      mdStr
    )) as string
    return this._createOrUpdate(id, content, mdStr)
  }

  async createOrUpdate(data: {
    id: string
    text: string | Email
    type: "html" | "markdown" | "email"
    mode?: "replace" | "append" | "prepend"
  }) {
    const { id, text, type, mode = "replace" } = data
    switch (type) {
      case "html":
        const content = (await this.callMain(
          MsgType.ConvertHtml2State,
          text
        )) as string

        const markdown = (await this.callMain(
          MsgType.GetDocMarkdown,
          content
        )) as string
        return this._createOrUpdate(id, content, markdown, mode)

      case "markdown":
        const content2 = (await this.callMain(
          MsgType.ConvertMarkdown2State,
          text
        )) as string
        return this._createOrUpdate(id, content2, text as string, mode)
      case "email":
        const content3 = (await this.callMain(MsgType.ConvertEmail2State, {
          space: this.dataSpace.dbName,
          email: text,
        })) as string
        const markdown3 = (await this.callMain(
          MsgType.GetDocMarkdown,
          content3
        )) as string
        return this._createOrUpdate(id, content3, markdown3, mode)
      default:
        throw new Error(`unknown type ${type}`)
    }
  }

  static mergeState = (oldState: string, newState: string) => {
    const _oldState = JSON.parse(
      oldState
    )

    const _appendState = JSON.parse(
      newState
    )

    _oldState.root.children.push(..._appendState.root.children)
    return JSON.stringify(_oldState)
  }

  async _createOrUpdate(
    id: string,
    content: string,
    markdown: string,
    mode: "replace" | "append" | "prepend" = "replace"
  ) {
    let is_day_page = /^\d{4}-\d{2}-\d{2}$/.test(id)
    const res = await this.get(id)
    try {
      if (!res) {
        await this.add({
          id,
          content,
          is_day_page,
          markdown,
        })
      } else {
        switch (mode) {
          case "replace":
            await this.set(id, {
              id,
              is_day_page,
              content,
              markdown,
            })
            break
          case "prepend":
            await this.set(id, {
              id,
              is_day_page,
              content: DocTable.mergeState(content, res.content),
              markdown: markdown + "\n" + res.markdown,
            })
            break
          case "append":
            await this.set(id, {
              id,
              is_day_page,
              content: DocTable.mergeState(res.content, content),
              markdown: res.markdown + "\n" + markdown,
            })
            break
          default:
            throw new Error(`unknown mode ${mode}`)
        }
      }
      return {
        id,
        success: true,
      }
    } catch (error) {
      console.error(error)
      return {
        id,
        success: false,
        msg: `${JSON.stringify(error)}`,
      }
    }
  }
}
