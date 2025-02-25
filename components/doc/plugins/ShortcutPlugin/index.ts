import { $isListItemNode, ListItemNode, ListNode } from "@lexical/list"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useKeyPress } from "ahooks"
import { $getSelection, $createParagraphNode, $isParagraphNode, ParagraphNode, $isTextNode, $createTextNode, $createRangeSelection, $setSelection, $isRangeSelection } from "lexical"
import { $duplicateParagraph } from "../../utils/selection"
import { useCallback } from "react"

export function ShortcutPlugin() {
  const [editor] = useLexicalComposerContext()

  //   toggle check list
  useKeyPress(
    ["ctrl.Enter", "meta.Enter"],
    (e) => {
      e.stopPropagation()
      editor.update(() => {
        if (!editor.isEditable()) {
          return
        }
        const selection = $getSelection()
        const nodes = selection?.getNodes()
        if (nodes?.length === 1) {
          const node = nodes[0]
          if ($isListItemNode(node)) {
            const parent = node.getParent() as ListNode
            if (parent.getListType() === "check") {
              ; (node as ListItemNode).toggleChecked()
            }
          } else if ($isListItemNode(node.getParent())) {
            const parent = node.getParent() as ListItemNode
            const listNode = parent.getParent() as ListNode
            if (listNode.getListType() === "check") {
              parent.toggleChecked()
            }
          }
        }
      })
    },
    {
      useCapture: true,
    }
  )

  const duplicateParagraph = useCallback((isUp: boolean) => {
    editor.update(() => {
      if (!editor.isEditable()) {
        return
      }
      $duplicateParagraph(isUp)
    })
  }, [editor])

  // Duplicate paragraph up
  useKeyPress(
    ["shift.alt.uparrow"],
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      duplicateParagraph(true)
    },
    {
      useCapture: true,
    }
  )

  // Duplicate paragraph down
  useKeyPress(
    ["shift.alt.downarrow"],
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      duplicateParagraph(false)
    },
    {
      useCapture: true,
    }
  )

  return null
}
