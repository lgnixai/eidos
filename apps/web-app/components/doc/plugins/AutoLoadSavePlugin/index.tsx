import { useCallback, useEffect, useRef } from "react"
import { $convertToMarkdownString } from "@lexical/markdown"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useDebounceFn, useKeyPress } from "ahooks"

import { useSqlite } from "@/apps/web-app/hooks/use-sqlite"

import { allTransformers } from "../const"

interface AutoLoadSavePluginProps {
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

export function AutoLoadSavePlugin(props: AutoLoadSavePluginProps) {
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
  }, [editor, isEditable])

  const loadInitialContent = useCallback(async () => {
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
      lock.current = false
    })
  }, [editor, docId, getDoc, isEditable])

  useEffect(() => {
    loadInitialContent()
  }, [loadInitialContent])

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

  // Add event listener for document refresh from playground
  useEffect(() => {
    const handleDocumentRefresh = (event: CustomEvent) => {
      const { docId: eventDocId } = event.detail || {}
      // Only refresh if this is the same document
      if (eventDocId && eventDocId === docId) {
        console.log(`Refreshing document ${docId} from playground changes`)
        loadInitialContent()
      }
    }

    window.addEventListener(
      "eidos-doc-refresh",
      handleDocumentRefresh as EventListener
    )

    return () => {
      window.removeEventListener(
        "eidos-doc-refresh",
        handleDocumentRefresh as EventListener
      )
    }
  }, [docId, loadInitialContent])

  return null
}
