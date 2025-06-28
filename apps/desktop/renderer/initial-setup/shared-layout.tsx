import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

import "./index.css"

// Shared layout component for initial setup pages
export function SetupLayout({
  children,
  onBack,
  backLabel = "Back",
}: {
  children: React.ReactNode
  onBack?: () => void
  backLabel?: string
}) {
  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900">
      {/* Drag Region - Top bar */}
      <div
        className="fixed top-0 left-0 right-0 h-12 z-50 bg-transparent flex items-center justify-center"
        id="drag-region"
      ></div>

      <div className="h-full flex items-center justify-center p-4 sm:p-6 pt-16">
        <div className="w-full">
          {onBack && (
            <div className="max-w-3xl mx-auto mb-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backLabel}
              </Button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
