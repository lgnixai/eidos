import { TextMatchTransformer } from "@lexical/markdown"
import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents"
import { DecoratorBlockNode, SerializedDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode"
import {
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from "lexical"

import { ChartBlock } from "./component"

export type SerializedChartNode = Spread<
  {
    config: string
  },
  SerializedDecoratorBlockNode
>

export class ChartNode extends DecoratorBlockNode {
  __config: string

  static getType(): string {
    return "chart"
  }

  static clone(node: ChartNode): ChartNode {
    return new ChartNode(node.__config, node.__format, node.__key)
  }

  constructor(config: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key)
    this.__config = config
  }

  setConfig(config: string) {
    const writable = this.getWritable()
    writable.__config = config
  }

  createDOM(): HTMLElement {
    return document.createElement("div")
  }

  updateDOM(): false {
    return false
  }

  exportJSON(): SerializedChartNode {
    return {
      ...super.exportJSON(),
      config: this.__config,
      type: "chart",
      version: 1,
    }
  }

  static importJSON(serializedNode: SerializedChartNode): ChartNode {
    const node = $createChartNode(serializedNode.config)
    node.setFormat(serializedNode.format)
    return node
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    if (!this.__config || this.__config.length === 0) {
      return <div>Empty Chart Configuration</div>
    }
    const embedBlockTheme = config.theme.embedBlock || {}
    const className = {
      base: embedBlockTheme.base || "",
      focus: embedBlockTheme.focus || "",
    }
    return (
      <BlockWithAlignableContents format={this.__format} className={className} nodeKey={this.__key}>
        <ChartBlock config={this.__config} nodeKey={this.__key} />
      </BlockWithAlignableContents>
    )
  }

  getTextContent(): string {
    return this.__config
  }
}

export function $createChartNode(config: string): ChartNode {
  return new ChartNode(config)
}

export function $isChartNode(node: LexicalNode | null | undefined): node is ChartNode {
  return node instanceof ChartNode
}

export const CHART_NODE_TRANSFORMER: TextMatchTransformer = {
  dependencies: [ChartNode],
  export: (node: LexicalNode, traverseChildren: (node: any) => string) => {
    if (!$isChartNode(node)) {
      return null
    }
    const configContent = node.getTextContent()
    return "```chart\n" + configContent + "\n" + "```"
  },
  importRegExp: /```chart([\s\S]*?)```/,
  regExp: /```chart([\s\S]*?)```$/,
  replace: (textNode, match) => {
    const config = match[1].trim()
    const chartNode = $createChartNode(config)
    textNode.replace(chartNode)
  },
  trigger: "```",
  type: "text-match",
} 