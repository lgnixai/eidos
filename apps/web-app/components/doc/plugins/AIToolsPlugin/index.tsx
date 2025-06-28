import { useCallback, useEffect, useState } from "react"
import { FloatingPortal } from "@floating-ui/react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getSelection,
  COMMAND_PRIORITY_EDITOR,
  KEY_ESCAPE_COMMAND,
  LexicalCommand,
  createCommand,
} from "lexical"
import { createPortal } from "react-dom"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { useEditorStore } from "../../hooks/useEditorContext"
import { AITools } from "./ai-tools"

export const INSERT_AI_COMMAND: LexicalCommand<string> =
  createCommand("INSERT_AI_COMMAND")

function scrollToVisualPosition(
  element: HTMLElement,
  { behavior = "smooth" } = {}
) {
  const rect = element.getBoundingClientRect()

  const scrollContainer = document.getElementById("main-content")
  const offsetX =
    (element.offsetWidth - (scrollContainer as HTMLElement).clientWidth) / 2
  const offsetY =
    (element.offsetHeight - (scrollContainer as HTMLElement).clientHeight) / 2
  const containerRect = (scrollContainer as HTMLElement).getBoundingClientRect()
  const scrollLeft = rect.left - containerRect.left + offsetX
  const scrollTop = rect.top - containerRect.top + offsetY + 38
  ;(scrollContainer as HTMLElement).scrollTo({
    left: (scrollContainer as HTMLElement).scrollLeft + scrollLeft,
    top: (scrollContainer as HTMLElement).scrollTop + scrollTop,
    behavior: behavior as ScrollBehavior,
  })
}

export const AIToolsPlugin = (props: any) => {
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [editor] = useLexicalComposerContext()
  const { setIsAIToolsOpen } = useEditorStore()
  const [content, setContent] = useState("")
  const [cancelActionConfirmOpen, setCancelActionConfirmOpen] = useState(false)

  const closeConfirm = useCallback(() => {
    setCancelActionConfirmOpen(false)
  }, [])

  const cancel = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      // Restore selection
      if (selection !== null) {
        selection.dirty = true
      }
    })
    setShowCommentInput(false)
  }, [editor])

  useEffect(() => {
    setIsAIToolsOpen(showCommentInput)
  }, [setIsAIToolsOpen, showCommentInput])

  useEffect(() => {
    if (showCommentInput) {
      setTimeout(() => {
        const box = document.getElementById("ai-tools-box")
        if (box) {
          scrollToVisualPosition(box as HTMLElement)
        }
      }, 200)
    }
  }, [showCommentInput])

  const cancelAIAction = useCallback(
    (showConfirm?: boolean) => {
      if (cancelActionConfirmOpen) {
        return
      }
      if (showConfirm) {
        setCancelActionConfirmOpen(true)
        return
      }
      cancel()
    },
    [cancel, cancelActionConfirmOpen]
  )

  useEffect(() => {
    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      (event: KeyboardEvent) => {
        event.preventDefault()
        cancelAIAction()
        return true
      },
      2
    )
  }, [cancelAIAction, editor])

  useEffect(() => {
    return editor.registerCommand(
      INSERT_AI_COMMAND,
      (content) => {
        setShowCommentInput(true)
        setContent(content)
        const domSelection = window.getSelection()
        if (domSelection !== null) {
          domSelection.removeAllRanges()
        }
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }, [editor])

  return (
    <div>
      {showCommentInput &&
        createPortal(
          <AITools cancelAIAction={cancelAIAction} content={content} />,
          document.body
        )}
      <AlertDialog
        open={cancelActionConfirmOpen}
        onOpenChange={setCancelActionConfirmOpen}
      >
        <AlertDialogTrigger asChild>
          <div />
        </AlertDialogTrigger>
        <AlertDialogContent role="ai-action-cancel-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard the AI response?</AlertDialogTitle>
            <AlertDialogDescription></AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirm}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={cancel}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
