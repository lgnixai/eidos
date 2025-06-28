import { useState } from "react"
import { Input } from "@/components/ui/input"
import useChangeEffect from "../hooks/use-change-effect"
import { EmptyValue } from "./common"

interface IUrlEditorProps {
  value: string | null
  onChange: (value: string | null) => void
  isEditing: boolean
}

export const UrlEditor = ({ value, isEditing, onChange }: IUrlEditorProps) => {
  const [_value, setValue] = useState(value)

  useChangeEffect(() => {
    onChange(_value || null)
  }, [_value, onChange])

  if (!isEditing) {
    return (
      <div className="flex h-full w-full items-center truncate">
        {_value ? (
          <a
            href={_value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80"
            onClick={(e) => e.stopPropagation()}
          >
            {_value}
          </a>
        ) : (
          <EmptyValue />
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <Input
        type="url"
        value={_value || ""}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  )
} 