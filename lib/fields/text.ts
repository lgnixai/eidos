import type { TextCell } from "@glideapps/glide-data-grid"

import { BaseField } from "./base"
import { FieldType, GridCellKind, TEXT_BASED_COMPARE_OPERATORS } from "./const"
import { IVecMeta } from "@/worker/web-worker/sdk/service/text"

export interface TextProperty {
  model?: string | null // Add other text-specific properties here if needed
  enableEmbedding?: boolean | null
  // when enableColorHint is true, the cell will be colored green when the vector is up to date, and yellow when the vector is out of date
  enableColorHint?: boolean | null
}

export class TextField extends BaseField<TextCell, TextProperty> {
  static type = FieldType.Text

  get compareOperators() {
    return TEXT_BASED_COMPARE_OPERATORS
  }

  rawData2JSON(rawData: string) {
    return rawData
  }

  getCellContent(rawData: string | null, context: {
    row: Record<string, any>
  }): TextCell {

    if (!this.column.property?.enableEmbedding || !this.column.property?.enableColorHint) {
      return {
        kind: GridCellKind.Text,
        data: rawData ? rawData + "" : "",
        displayData: rawData ? rawData + "" : "",
        allowOverlay: true,
      }
    }
    const fieldId = this.column.table_column_name
    const vecMetaFieldId = `${fieldId}__vec_meta`
    const vecMeta = context.row[vecMetaFieldId] ? JSON.parse(context.row[vecMetaFieldId]) as IVecMeta : null
    const isCellOutOfDate = vecMeta?.outOfDate
    if (isCellOutOfDate) {
      return {
        kind: GridCellKind.Text,
        data: rawData ? rawData + "" : "",
        displayData: rawData ? rawData + "" : "",
        allowOverlay: true,
        themeOverride: {
          bgCell: "#FFFBE6",
        },
      }
    }
    if (vecMeta) {
      return {
        kind: GridCellKind.Text,
        data: rawData ? rawData + "" : "",
        displayData: rawData ? rawData + "" : "",
        allowOverlay: true,
        themeOverride: {
          bgCell: "#E6FFEC",
        },
      }
    }
    return {
      kind: GridCellKind.Text,
      data: rawData ? rawData + "" : "",
      displayData: rawData ? rawData + "" : "",
      allowOverlay: true,
    }
  }

  cellData2RawData(cell: TextCell) {
    return {
      rawData: cell.data || null,
    }
  }
}
