import { FieldType } from "@/packages/core/fields/const"

import { makeHeaderIcons } from "./header-icons"

const icons = makeHeaderIcons(18)

export const FieldIcon = ({ type }: { type: FieldType }) => {
  const iconSvgString = icons[type]({
    bgColor: "#aaa",
    fgColor: "currentColor",
  })

  return (
    <span
      dangerouslySetInnerHTML={{
        __html: iconSvgString,
      }}
    ></span>
  )
}
