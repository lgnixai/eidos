import { motion } from "framer-motion"

interface ToolCallSkeletonProps {
  toolName: string
  toolCallId: string
  args?: Record<string, any>
}

export const ToolCallSkeleton = ({
  toolName,
  toolCallId,
  args,
}: ToolCallSkeletonProps) => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col p-2 bg-muted/30 rounded-lg border border-border/50">
        <div className="flex items-center gap-2">
          <div className="relative size-5 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse" />
            <div className="absolute inset-[1px] bg-background rounded-full flex items-center justify-center">
              <div className="size-1.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-ping" />
            </div>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {toolName}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                Calling...
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <motion.div
                className="size-1 bg-blue-400 rounded-full"
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="size-1 bg-purple-400 rounded-full"
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2,
                }}
              />
              <motion.div
                className="size-1 bg-pink-400 rounded-full"
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.4,
                }}
              />
              <span className="ml-1">Processing tool call</span>
            </div>
          </div>
        </div>

        {args && Object.keys(args).length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <div className="text-xs text-muted-foreground/70">
              <div className="font-medium mb-1.5">Arguments:</div>
              <div className="space-y-1">
                {Object.entries(args).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground/90">{key}:</span>
                    <div className="flex-1 min-w-0">
                      <div className="h-2.5 bg-muted/50 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
