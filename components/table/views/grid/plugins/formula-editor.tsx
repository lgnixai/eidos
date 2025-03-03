import { useContext, useEffect, useState } from "react"
import { useDebounceFn } from "ahooks"
import {
  Calculator,
  FunctionSquareIcon,
  Hash,
  Info,
  Variable,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next"

import { FormulaProperty } from "@/lib/fields/formula"
import { IField } from "@/lib/store/interface"
import { cn } from "@/lib/utils"
import { useFormulaUpdate } from "@/hooks/use-formula-update"
import { useFormulaValidation } from "@/hooks/use-formula-validation"
import { usePreviewTableFormula } from "@/hooks/use-preview-table-formula"
import { useTableOperation } from "@/hooks/use-table"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CodeMirrorFormulaEditor,
  CodeMirrorFormulaEditorRef,
} from "@/components/formula-editor/codemirror-editor"
import {
  UiColumn,
  getCompletions,
} from "@/components/formula-editor/completions"
import { TableContext } from "@/components/table/hooks"

export const FormulaEditor = ({
  editorRef,
  closeEditor,
  formulaField,
  uiColumns,
  rowId,
}: {
  editorRef: React.RefObject<CodeMirrorFormulaEditorRef>
  closeEditor: () => void
  formulaField: IField<FormulaProperty> | null
  uiColumns: UiColumn[]
  rowId: string | null
}) => {
  const { t } = useTranslation()
  const [formula, setFormula] = useState(formulaField?.property.formula ?? "")
  const { udfs = [], tableName, space } = useContext(TableContext)
  const { updateFieldProperty } = useTableOperation(tableName, space)
  const { theme } = useTheme()
  const [previewResult, setPreviewResult] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const { preview } = usePreviewTableFormula()
  const validateFormula = useFormulaValidation()

  const { run: validateAndPreview } = useDebounceFn(
    async () => {
      const result = validateFormula(formula, formulaField)
      if (result.isValid && result.result) {
        setValidationError(null)
        const previewResult = await preview({
          tableName,
          formula: result.result,
          rowId,
        })
        setPreviewResult(previewResult)
      } else {
        setValidationError(result.error)
      }
    },
    { wait: 500 }
  )

  useEffect(() => {
    formulaField?.property.formula && setFormula(formulaField?.property.formula)
  }, [formulaField?.property.formula])

  useEffect(() => {
    validateAndPreview()
  }, [formula, rowId])

  const { error, updateFormula } = useFormulaUpdate(
    formulaField,
    (property) => {
      if (formulaField) {
        updateFieldProperty(formulaField, property)
      }
    }
  )
  const handleSave = () => {
    if (formulaField) {
      const isUpdated = updateFormula(
        formula,
        formulaField.property.displayType
      )
      if (isUpdated) {
        closeEditor()
      }
    }
  }
  const handleCurrentTokenChange = (
    token: { text: string; type: string } | null
  ) => {
    try {
      if (token?.type === "Identifier") {
        const completionItems = getCompletionItems()
        const completionItem = completionItems.find(
          (item) => item.label.toLowerCase() === token.text.toLowerCase()
        )
        if (completionItem) {
          setSelectedItem(completionItem)
          // scroll to the completion item
          const completionItemElement = document.querySelector(
            `.group[data-label="${completionItem.label}"]`
          )
          if (completionItemElement) {
            completionItemElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            })
          }
        }
      }
    } catch (error) {
      console.error("Error in handleCurrentTokenChange:", error)
    }
  }

  const renderCompletionItem = (item: any) => (
    <div
      key={item.label}
      data-label={item.label}
      className={cn(
        "group relative flex px-3 py-2 hover:bg-accent cursor-pointer text-sm",
        selectedItem?.label === item.label && "bg-accent"
      )}
      onClick={() => {
        try {
          if (editorRef.current) {
            const suffix = item.type === "function" ? "()" : ""
            editorRef.current.insertText(item.label + suffix)
          }
        } catch (error) {
          console.error("Error inserting text:", error)
        }
      }}
    >
      <div className="mr-2 flex-shrink-0 mt-0.5 text-muted-foreground">
        {item.type === "function" && <FunctionSquareIcon size={16} />}
        {item.type === "variable" && <Variable size={16} />}
        {item.type === "constant" && <Calculator size={16} />}
        {(item.type === "keyword" || item.type === "operator") && (
          <Hash size={16} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{item.label}</div>
        {item.info && (
          <div className="text-xs text-muted-foreground truncate">
            {item.info}
          </div>
        )}
      </div>
    </div>
  )

  const handleArrowNavigation = (direction: "up" | "down") => {
    try {
      const items = getCompletionItems()
      if (items.length === 0) return

      if (!selectedItem) {
        setSelectedItem(items[0])
        return
      }

      const currentIndex = items.findIndex(
        (item) => item.label === selectedItem.label
      )

      let newIndex
      if (direction === "up") {
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
      } else {
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
      }

      setSelectedItem(items[newIndex])

      // Scroll to the selected item
      const completionItemElement = document.querySelector(
        `.group[data-label="${items[newIndex].label}"]`
      )
      if (completionItemElement) {
        completionItemElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
    } catch (error) {
      console.error(
        `Error in handleArrow${direction === "up" ? "Up" : "Down"}:`,
        error
      )
    }
  }

  const handleArrowUp = () => handleArrowNavigation("up")
  const handleArrowDown = () => handleArrowNavigation("down")

  const handleEnter = () => {
    try {
      if (selectedItem) {
        const suffix = selectedItem.type === "function" ? "()" : ""
        editorRef.current?.insertText(selectedItem.label + suffix)
      }
    } catch (error) {
      console.error("Error in handleEnter:", error)
    }
  }

  const getCompletionItems = () => {
    return getCompletions(uiColumns, udfs || [])
  }

  return (
    <div className="bg-background w-full min-w-[500px] max-w-[600px] border rounded-lg flex shadow-lg">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <CodeMirrorFormulaEditor
          ref={editorRef}
          value={formula}
          onChange={(value) => setFormula(value)}
          onEsc={closeEditor}
          onCurrentTokenChange={handleCurrentTokenChange}
          onArrowUp={handleArrowUp}
          onArrowDown={handleArrowDown}
          onEnter={handleEnter}
          columns={uiColumns}
          udfs={udfs}
          height="100px"
        />
        <div className="flex justify-end gap-2 absolute top-[60px] right-2 z-10">
          <Button variant="outline" size="sm" onClick={closeEditor}>
            {t("common.cancel")}
          </Button>
          <Button variant="default" size="sm" onClick={handleSave}>
            {t("common.save")}
          </Button>
        </div>
        <div className="min-h-[40px] p-2">
          {validationError ? (
            <p className="text-sm text-destructive font-medium">
              {validationError}
            </p>
          ) : previewResult ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={16} />
                  </TooltipTrigger>
                  <TooltipContent>{t("formula.editor.preview")}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {previewResult}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground opacity-0">
              {t("formula.editor.preview")}
            </p>
          )}
        </div>
        <div className="w-full border-t grid grid-cols-5">
          <div className="col-span-2 border-r">
            <div className="max-h-[200px] overflow-y-auto">
              <div className="py-1">
                {getCompletionItems().map((item) => (
                  <div
                    key={item.label}
                    className="group"
                    onMouseEnter={() => setSelectedItem(item)}
                  >
                    {renderCompletionItem(item)}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-span-3 p-4">
            {selectedItem?.example && (
              <div className="text-sm text-muted-foreground">
                <div className="font-medium mb-2">
                  {t("formula.editor.example")}
                </div>
                <div className="bg-muted p-2 rounded">
                  {selectedItem.example}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-3 border-t">
          <p className="text-sm text-muted-foreground">
            {t("formula.editor.hint")}
          </p>
        </div>
      </div>
    </div>
  )
}
