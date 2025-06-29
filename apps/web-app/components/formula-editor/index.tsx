import { CodeMirrorFormulaEditor } from "./codemirror-editor"
import type { Udf } from "./completions"

export const FormulaEditor = ({
  value,
  onChange,
  onSave,
  language = "javascript",
  udfs = [],
}: {
  value: string
  language: string
  onChange: (value: string) => void
  onSave?: (value: string) => void
  udfs?: Udf[]
}) => {
  return (
    <CodeMirrorFormulaEditor
      value={value}
      onChange={onChange}
      onSave={onSave}
      language={language}
      udfs={udfs}
    />
  )
}
