import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

type CalloutType = "info" | "warning" | "error" | "success"

interface CalloutProps {
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
  type?: CalloutType
}

const calloutStyles: Record<
  CalloutType,
  {
    container: string
    icon: string
    text: string
    defaultIcon: React.ReactNode
  }
> = {
  info: {
    container: "border-blue-200 bg-blue-50",
    icon: "text-blue-500",
    text: "text-blue-700",
    defaultIcon: <InfoIcon className="h-4 w-4" />,
  },
  warning: {
    container: "border-yellow-200 bg-yellow-50",
    icon: "text-yellow-500",
    text: "text-yellow-700",
    defaultIcon: <AlertTriangleIcon className="h-4 w-4" />,
  },
  error: {
    container: "border-red-200 bg-red-50",
    icon: "text-red-500",
    text: "text-red-700",
    defaultIcon: <AlertCircleIcon className="h-4 w-4" />,
  },
  success: {
    container: "border-green-200 bg-green-50",
    icon: "text-green-500",
    text: "text-green-700",
    defaultIcon: <CheckCircleIcon className="h-4 w-4" />,
  },
}

export function Callout({
  children,
  className,
  icon,
  type = "info",
}: CalloutProps) {
  const styles = calloutStyles[type]

  return (
    <div
      className={cn(
        "flex items-start rounded-md border p-4",
        styles.container,
        className
      )}
    >
      <div className={cn("mr-4 mt-[2px] flex-shrink-0", styles.icon)}>
        {icon ?? styles.defaultIcon}
      </div>
      <div className={cn("text-sm", styles.text)}>{children}</div>
    </div>
  )
}
