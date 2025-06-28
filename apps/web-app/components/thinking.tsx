import { motion } from "framer-motion"

export const Thinking = () => (
  <div className="flex items-center gap-1 text-muted-foreground">
    <span>💭Thinking</span>
    <motion.span
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 1, 0],
        transition: {
          repeat: Infinity,
          duration: 1.5,
          ease: "easeInOut",
        },
      }}
    >
      ...
    </motion.span>
  </div>
)
