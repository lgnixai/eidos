import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react"
import { createDOMRange, createRectsFromDOMRange } from "@lexical/selection"
import {
  $getSelection,
  $isRangeSelection,
  LexicalEditor,
  RangeSelection,
} from "lexical"

export const useUpdateLocation = (
  editor: LexicalEditor,
  selectionRef: React.MutableRefObject<RangeSelection | null>,
  boxRef: React.MutableRefObject<HTMLDivElement | null>
) => {
  const [editorWidth, setEditorWidth] = useState(0)
  const [containerLeft, setContainerLeft] = useState(0)
  const selectionState = useMemo(
    () => ({
      container: document.createElement("div"),
      elements: [],
    }),
    []
  )

  const updateLocation = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()

      if ($isRangeSelection(selection)) {
        selectionRef.current = selection.clone()
        const anchor = selection.anchor
        const focus = selection.focus
        const range = createDOMRange(
          editor,
          anchor.getNode(),
          anchor.offset,
          focus.getNode(),
          focus.offset
        )
        const boxElem = boxRef.current
        if (range !== null && boxElem !== null) {
          const { left, bottom, width } = range.getBoundingClientRect()
          const selectionRects = createRectsFromDOMRange(editor, range)
          let correctedLeft =
            selectionRects.length === 1 ? left + width / 2 - 125 : left - 125
          if (correctedLeft < 10) {
            correctedLeft = 10
          }
          const translateX = containerLeft
          const translateY =
            bottom + 8 + (window.pageYOffset || document.documentElement.scrollTop)

          boxElem.style.left = "0px"
          boxElem.style.top = "0px"
          boxElem.style.transform = `translate(${translateX}px, ${translateY}px)`
          // boxElem.style.height = `${boxElem.clientHeight}px`
          // ?.setAttribute("style", `height: ${boxElem.clientHeight}px;`)
          const selectionRectsLength = selectionRects.length
          const { container } = selectionState
          const elements: Array<HTMLSpanElement> = selectionState.elements
          const elementsLength = elements.length

          for (let i = 0; i < selectionRectsLength; i++) {
            const selectionRect = selectionRects[i]
            let elem: HTMLSpanElement = elements[i]
            if (elem === undefined) {
              elem = document.createElement("span")
              elements[i] = elem
              container.appendChild(elem)
            }
            const offsetTop =
              selectionRect.top + (window.pageYOffset || document.documentElement.scrollTop)
            const offsetLeft = selectionRect.left
            const color = "255, 212, 0"

            elem.style.position = "absolute"
            elem.style.top = "0px"
            elem.style.left = "0px"
            elem.style.width = `${selectionRect.width}px`
            elem.style.height = `${selectionRect.height}px`
            elem.style.backgroundColor = `rgba(${color}, 0.3)`
            elem.style.pointerEvents = "none"
            elem.style.zIndex = "5"
            elem.style.transform = `translate(${offsetLeft}px, ${offsetTop}px)`
          }
          for (let i = elementsLength - 1; i >= selectionRectsLength; i--) {
            const elem = elements[i]
            container.removeChild(elem)
            elements.pop()
          }
        }
      }
    })
  }, [boxRef, editor, selectionRef, selectionState, containerLeft])

  useEffect(() => {
    const main = document.querySelector("#main-content")
    main?.addEventListener("scroll", updateLocation)

    return () => {
      main?.removeEventListener("scroll", updateLocation)
    }
  }, [updateLocation])

  useLayoutEffect(() => {
    updateLocation()
    const container = selectionState.container
    const editorContainer = document.querySelector("#editor-container-inner")

    setContainerLeft(editorContainer?.getBoundingClientRect()?.left || 0)
    if (editorWidth !== editorContainer?.clientWidth) {
      setEditorWidth(editorContainer?.clientWidth || 0)
    }
    const body = document.body
    if (body !== null) {
      body.appendChild(container)
      return () => {
        body.removeChild(container)
      }
    }
  }, [editorWidth, selectionState.container, updateLocation])

  useEffect(() => {
    window.addEventListener("resize", updateLocation)

    return () => {
      window.removeEventListener("resize", updateLocation)
    }
  }, [updateLocation])

  return {
    editorWidth,
  }
} 