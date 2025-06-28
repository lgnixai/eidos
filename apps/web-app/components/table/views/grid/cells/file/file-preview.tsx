import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

const PREVIEW_TYPES = ["image", "audio", "video"]
export const FilePreview = ({
  url,
  type,
  onClose,
}: {
  url: string
  type: string
  onClose: () => void
}) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    const newContainer = document.createElement("div")
    document.body.appendChild(newContainer)
    setContainer(newContainer)

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscKey)

    return () => {
      if (newContainer.parentNode) {
        document.body.removeChild(newContainer)
      }
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [])

  if (!container) {
    return null
  }

  return createPortal(
    <div
      className="click-outside-ignore"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 9999,
      }}
    >
      {type === "image" && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            maxWidth: "80%",
            maxHeight: "80vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <img
            src={url}
            alt="preview"
            style={{
              maxWidth: "100%",
              maxHeight: "calc(80vh - 40px)",
              objectFit: "contain",
            }}
          />
        </div>
      )}
      {type === "audio" && (
        <audio
          src={url}
          controls
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "80%" }}
        />
      )}
      {type === "video" && (
        <video
          src={url}
          controls
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "80%", maxHeight: "80%" }}
        />
      )}
      {!PREVIEW_TYPES.includes(type) && (
        <p className="text-4xl text-red-600">not support preview</p>
      )}
    </div>,
    container
  )
}
