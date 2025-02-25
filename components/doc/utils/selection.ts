import { createHeadlessEditor } from "@lexical/headless"
import { $convertToMarkdownString } from "@lexical/markdown"
import { $createParagraphNode, $createRangeSelection, $createTextNode, $getRoot, $getSelection, $isParagraphNode, $isRangeSelection, $setSelection, BaseSelection, RootNode } from "lexical"

import { _getDocMarkdown } from "@/hooks/use-doc-editor"

import { getAllNodes } from "../nodes"
import { allTransformers } from "../plugins/const"



export function $duplicateParagraph(isUp: boolean) {
  const selection = $getSelection()
  const nodes = selection?.getNodes()

  if (nodes?.length === 1) {
    const node = nodes[0]
    const paragraph = $isParagraphNode(node) ?
      node :
      node.getParent()

    if ($isParagraphNode(paragraph)) {
      const clone = $createParagraphNode()
      const text = $createTextNode(paragraph.getTextContent())
      clone.append(text)

      if (isUp) {
        paragraph.insertBefore(clone)
      } else {
        paragraph.insertAfter(clone)
      }

      if ($isRangeSelection(selection)) {
        const offset = selection.anchor.offset || 0
        const newSelection = $createRangeSelection()
        newSelection.anchor.set(text.getKey(), offset, "text")
        newSelection.focus.set(text.getKey(), offset, "text")
        $setSelection(newSelection)
      }
    }
  }
}


/**
 * 
 * @param selection 
 * @returns 
 */
export function getMarkdownFromSelection(selection: BaseSelection | null) {
  if (selection === null) {
    return ""
  }
  const nodes = selection.getNodes()
  //   nodes are a list of nodes, each node has parent. prev, next. rebuild a node tree

  const editor = createHeadlessEditor({
    nodes: getAllNodes(),
    onError: () => { },
  })
  const _nodes = nodes.map((node) => node.exportJSON())

  try {
    const _state = {
      root: {
        children: [
          {
            children: [],
            direction: null,
            format: "",
            indent: 0,
            type: "paragraph",
            version: 1,
          },
          ..._nodes,
        ],
        direction: null,
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    }
    console.log(_state)
    const state = editor.parseEditorState(JSON.stringify(_state))
    console.log(state)
    if (state.isEmpty()) {
      return ""
    }
    editor.update(
      () => {
        const root = $getRoot()
        const markdown = $convertToMarkdownString(allTransformers)
        console.log("markdown", markdown)
        return markdown
      },
      {
        discrete: true,
      }
    )
  } catch (error) { }
}
