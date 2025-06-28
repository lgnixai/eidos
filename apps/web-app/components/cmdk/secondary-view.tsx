import { useKeyPress } from "ahooks"
import { ArrowLeft } from "lucide-react"

import { Button } from "../ui/button"

interface SecondaryViewProps {
  component: React.ReactNode
  title: string
  onBack: () => void
}

export const SecondaryView = ({
  component,
  title,
  onBack,
}: SecondaryViewProps) => {
  useKeyPress(
    "esc",
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      onBack()
    },
    {
      useCapture: true,
    }
  )
  return (
    <div className="flex flex-col gap-2 relative">
      {/* back button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="absolute top-0 left-0"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="p-2">{component}</div>
    </div>
  )
}
