
import { ITreeNode } from "./ITreeNode"
import { IView } from "./IView"
import { IField } from "../../core/fields/IField"

export interface ITable {
  rowMap: {
    [rowId: string]: Record<string, any>
  }
  fieldMap: {
    [fieldId: string]: IField
  }
  viewMap: {
    [viewId: string]: IView
  }
  viewIds: string[]
}

export interface IDataStore {
  tableMap: {
    [nodeId: string]: ITable
  }
  nodeIds: string[]
  nodeMap: {
    [nodeId: string]: ITreeNode
  }
}
