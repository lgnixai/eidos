import React from "react"
import { ViewTypeEnum } from "@/packages/core/types/IView"
import {
  FileQuestionIcon,
  LayoutGridIcon,
  LayoutListIcon,
  SquareKanbanIcon,
  Table2Icon,
} from "lucide-react"

import { IconRenderer } from "../ui/icon-picker"
import { useTableViewInfoByExtType } from "./hooks/use-custom-table-views"

export const ViewIconMap = {
  [ViewTypeEnum.Grid]: Table2Icon,
  [ViewTypeEnum.Gallery]: LayoutGridIcon,
  [ViewTypeEnum.DocList]: LayoutListIcon,
  [ViewTypeEnum.Kanban]: SquareKanbanIcon,
}

interface ViewIconProps {
  viewType: string
  className?: string
  showCursor?: boolean
}

export const ViewIcon: React.FC<ViewIconProps> = ({
  viewType,
  className = "h-4 w-4",
  showCursor = false,
}) => {
  // Get extension info for custom views
  const extView = useTableViewInfoByExtType(viewType)

  // Determine which icon to use
  let Icon = ViewIconMap[viewType as ViewTypeEnum]

  if (viewType.startsWith("ext__")) {
    if (extView?.icon) {
      // Use extension's custom icon if available
      if (extView.icon.startsWith("data:image")) {
        // Data URI image
        return (
          <img
            src={extView.icon}
            alt={extView.name}
            className={`${className} ${showCursor ? "cursor-grab active:cursor-grabbing" : ""} rounded object-cover`}
          />
        )
      } else {
        // Lucide icon name
        return <IconRenderer name={extView.icon as any} className={className} />
      }
    } else {
      // Fallback to FileQuestionIcon if no custom icon
      Icon = FileQuestionIcon
    }
  }

  // Render default icon or fallback
  return <Icon className={className} />
}
