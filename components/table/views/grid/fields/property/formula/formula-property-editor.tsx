import { useEffect, useRef, useState } from "react"
import { FunctionSquareIcon } from "lucide-react"

import { FieldType } from "@/lib/fields/const"
import { FormulaProperty } from "@/lib/fields/formula"
import { IField } from "@/lib/store/interface"
import { useCurrentUiColumns } from "@/hooks/use-ui-columns"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CodeMirrorFormulaEditorRef } from "@/components/formula-editor/codemirror-editor"

import { FormulaEditor } from "../../../plugins/formula-editor"

interface IFieldPropertyEditorProps {
  uiColumn: IField<FormulaProperty>
  onPropertyChange: (property: FormulaProperty) => void
  isCreateNew?: boolean
}

export const FormulaPropertyEditor = (props: IFieldPropertyEditorProps) => {
  const { formula = "upper(title)" } =
    props.uiColumn.property ?? ({} as FormulaProperty)
  const [displayType, setDisplayType] = useState(
    props.uiColumn.property.displayType
  )
  const ref = useRef<HTMLDivElement>(null)
  const editorRef = useRef<CodeMirrorFormulaEditorRef>(null)
  const [isOpen, setIsOpen] = useState(false)
  const { uiColumns } = useCurrentUiColumns()

  const handleChangeFieldDisplayType = (value: FieldType) => {
    setDisplayType(value)
    props.onPropertyChange({ ...props.uiColumn.property, displayType: value })
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        editorRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  return (
    <div className="flex flex-col gap-8" ref={ref}>
      <div className="flex flex-col gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <p className="text-sm text-gray-500 flex items-start gap-2">
              <FunctionSquareIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {formula}
            </p>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 border-none"
            container={ref.current!}
            side="left"
            align="start"
            alignOffset={20}
          >
            <FormulaEditor
              editorRef={editorRef}
              closeEditor={() => setIsOpen(false)}
              formulaField={props.uiColumn}
              uiColumns={uiColumns}
              rowId={null}
            />
          </PopoverContent>
        </Popover>
        <div className="flex items-center justify-between">
          <Label>Display as</Label>
          <Select
            value={displayType}
            onValueChange={(value) =>
              handleChangeFieldDisplayType(value as any)
            }
          >
            <SelectTrigger className="click-outside-ignore w-[200px]">
              <SelectValue placeholder="display as" />
            </SelectTrigger>
            <SelectContent className="click-outside-ignore">
              <SelectItem value={FieldType.Text}>Text</SelectItem>
              <SelectItem value={FieldType.URL}>URL</SelectItem>
              <SelectItem value={FieldType.File}>Files</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
