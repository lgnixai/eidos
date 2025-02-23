import { useCallback, useEffect, useRef } from "react"
import { $convertToMarkdownString } from "@lexical/markdown"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useDebounceFn, useKeyPress } from "ahooks"
import { $getNodeByKey, $getSelection, $isRangeSelection } from "lexical"

import { useSqlite } from "@/hooks/use-sqlite"

import { allTransformers } from "../const"

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

interface AutoSavePluginProps {
  docId: string
  disableManuallySave?: boolean
  isEditable?: boolean
}

export const DefaultState = {
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
    ],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
}

// this plugin is just used for eidos doc not a general plugin
export function EidosAutoLoadSaveFocusPlugin(props: AutoSavePluginProps) {
  const [editor] = useLexicalComposerContext()
  const { docId, disableManuallySave, isEditable } = props
  const lock = useRef(false)
  const { updateDoc, getDoc } = useSqlite()

  const handleSave = useCallback(async () => {
    if (!editor.isEditable()) return

    editor.update(async () => {
      const json = editor.getEditorState().toJSON()
      const content = JSON.stringify(json)
      const markdown = $convertToMarkdownString(allTransformers)
      await updateDoc(docId, content, markdown)
    })
  }, [docId, editor, updateDoc])

  useKeyPress(["ctrl.s", "meta.s"], (e) => {
    e.preventDefault()
    if (disableManuallySave) return
    handleSave()
  })

  useEffect(() => {
    editor.setEditable(Boolean(isEditable))
    if (isEditable) {
      if (editor._config.namespace === "eidos-notes-home-page") {
        // disable auto focus for home page's editor
        return
      }
      setTimeout(
        () => editor.focus(undefined, { defaultSelection: "rootStart" }),
        0
      )
    }
  }, [editor, isEditable])

  useEffect(() => {
    const loadInitialContent = async () => {
      lock.current = true
      const initContent = await getDoc(docId)

      let state = JSON.stringify(DefaultState)
      if (initContent) {
        try {
          state = initContent
        } catch (error) {
          console.error("Error parsing content:", error)
        }
      }

      editor.update(() => {
        const parsedState = editor.parseEditorState(state)
        editor.setEditorState(parsedState)
        editor.setEditable(Boolean(isEditable))

        if (editor.isEditable()) {
          if (editor._config.namespace === "eidos-notes-home-page") {
            // disable auto focus for home page's editor
            return
          }
          setTimeout(
            () => editor.focus(undefined, { defaultSelection: "rootStart" }),
            0
          )
        }
        lock.current = false
      })
    }

    loadInitialContent()
  }, [editor, docId, getDoc, isEditable])

  const { run: debounceSave } = useDebounceFn(updateDoc, { wait: 500 })

  useEffect(() => {
    const unRegister = editor.registerUpdateListener(
      ({ editorState, prevEditorState }) => {
        if (lock.current) return

        editor.update(() => {
          const json = editorState.toJSON()
          const oldJson = prevEditorState.toJSON()
          const content = JSON.stringify(json)
          const oldContent = JSON.stringify(oldJson)

          if (content === oldContent) return

          const markdown = $convertToMarkdownString(allTransformers)
          debounceSave(docId, content, markdown)
        })
      }
    )
    return () => unRegister()
  }, [editor, debounceSave, docId])

  // Add new function to handle focus
  const handleFocusRootStart = useCallback(() => {
    if (!editor.isEditable()) return

    editor.focus(undefined, { defaultSelection: "rootStart" })
  }, [editor])

  // Add event listener for custom focus event
  useEffect(() => {
    const handleCustomFocus = () => {
      handleFocusRootStart()
    }

    window.addEventListener("eidos-editor-focus", handleCustomFocus)

    return () => {
      window.addEventListener("eidos-editor-focus", handleCustomFocus)
    }
  }, [handleFocusRootStart])

  // Update the keydown effect to use the new function
  useEffect(() => {
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
