import { useCallback, useEffect } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getNodeByKey, $getSelection, $isRangeSelection } from "lexical"

/**
 * Check if the cursor is at the start of the document
 * Handles different node structures:
 * 1. root => paragraph => text
 * 2. root => list => listitem => text
 */
export function $isAtDocumentStart() {
  const selection = $getSelection()
  if (!selection || !$isRangeSelection(selection)) return false

  const anchor = selection.anchor
  const anchorNode = $getNodeByKey(anchor.key)
  if (!anchorNode) return false

  // First check if cursor is at start
  if (anchor.offset !== 0) return false

  // Get parent node (usually paragraph or listitem)
  const parentNode = anchorNode.getParent()
  if (!parentNode) return false

  // Handle paragraph case
  if (parentNode.getType() === "paragraph") {
    if (parentNode.getPreviousSibling()) return false
    return parentNode.getParent()?.getType() === "root"
  }

  // Handle list case
  if (parentNode.getType() === "listitem" || parentNode.getType() === "list") {
    return false
  }

  // For other cases, find top-level node
  let topLevelNode = anchorNode
  while (topLevelNode.getParent()?.getParent()) {
    topLevelNode = topLevelNode.getParent()!
  }

  return (
    !topLevelNode.getPreviousSibling() && // No previous sibling for the top-level block
    topLevelNode.getParent()?.getType() === "root" // Direct child of root
  )
}

interface EditorFocusPluginProps {
  isEditable?: boolean
  disableAutoFocus?: boolean
  disableJumpToTitle?: boolean
}

export function EditorFocusPlugin(props: EditorFocusPluginProps) {
  const [editor] = useLexicalComposerContext()
  const { isEditable, disableAutoFocus, disableJumpToTitle } = props
  const namespace = editor._config.namespace
  useEffect(() => {
    editor.setEditable(Boolean(isEditable))
    if (isEditable) {
      if (namespace === "eidos-notes-home-page") {
        // disable auto focus for home page's editor
        return
      }
      setTimeout(
        () => editor.focus(undefined, { defaultSelection: "rootStart" }),
        0
      )
    }
  }, [editor, isEditable, namespace])

  // Add new function to handle focus
  const handleFocusRootStart = useCallback(() => {
    if (!editor.isEditable()) return
    editor.focus(undefined, { defaultSelection: "rootStart" })
  }, [editor])

  // Add event listener for custom focus event
  useEffect(() => {
    if (disableAutoFocus) return
    const handleCustomFocus = () => {
      handleFocusRootStart()
    }

    window.addEventListener("eidos-editor-focus", handleCustomFocus)

    return () => {
      window.removeEventListener("eidos-editor-focus", handleCustomFocus)
    }
  }, [handleFocusRootStart])

  // Update the keydown effect to use the new function
  useEffect(() => {
    if (disableJumpToTitle) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Backspace") return
      editor.getEditorState().read(() => {
        if ($isAtDocumentStart()) {
          window.dispatchEvent(new CustomEvent("eidos-editor-activate-title"))
          event.preventDefault()
        }
      })
    }

    editor.getRootElement()?.addEventListener("keydown", handleKeyDown)

    return () => {
      editor.getRootElement()?.removeEventListener("keydown", handleKeyDown)
    }
  }, [editor])

  return null
}
