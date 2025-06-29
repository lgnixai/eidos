import { getFieldInstance } from "@/packages/core/fields"
import type { CompareOperator } from "@/packages/core/fields/const"
import type { IField } from "@/packages/core/types/IField"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface IFieldCompareSelectorProps {
  field?: IField
  value: CompareOperator
  onChange: (value: CompareOperator) => void
}

export const FieldCompareSelector = ({
  field,
  value,
  onChange,
}: IFieldCompareSelectorProps) => {
  if (!field) {
    return null
  }
  const fieldInstance = getFieldInstance(field)
  const fieldCompareOperators = fieldInstance.compareOperators
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Field" />
      </SelectTrigger>
      <SelectContent position="popper">
        {fieldCompareOperators.map((op) => {
          return (
            <SelectItem value={op} key={op} className="pl-2">
              <span className="flex items-center gap-2">{op}</span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
