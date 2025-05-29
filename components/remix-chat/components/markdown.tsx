import { memo, useEffect, useRef, useState } from "react"
import Prism from "prismjs"
import ReactMarkdown, { type Components } from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import remarkInternalLinks from "./remark-internal-links"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { useCurrentPathInfo } from "@/hooks/use-current-pathinfo"
import { isDayPageId } from "@/lib/utils"

import "prismjs/themes/prism-tomorrow.css"
import "./prism-custom.css"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-tsx"
import { ChevronDownIcon, ChevronUpIcon, LinkIcon } from "lucide-react"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "llm-response": {
        language?: string
        title?: string
        children?: React.ReactNode
      }
    }
  }
}

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const navigate = useNavigate()
  const { space } = useCurrentPathInfo()
  
  useEffect(() => {
    Prism.highlightAll()
  }, [children])

  const handleInternalLinkClick = (id: string) => {
    if (isDayPageId(id)) {
      navigate(`/${space}/everyday/${id}`)
    } else {
      navigate(`/${space}/${id}`)
    }
  }

  const components: Partial<Components> = {
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "")
      const language = match?.[1]
      const [isCollapsed, setIsCollapsed] = useState(true)

      if (inline || !match) {
        return (
          <code
            className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`}
            {...props}
          >
            {children}
          </code>
        )
      }

      if (
        language === "javascript" ||
        language === "jsx" ||
        language === "tsx" ||
        language === "python"
      ) {
        const code = children?.toString()
        const linesCount = code?.split("\n").length
        const filename =
          language === "python"
            ? "main.py"
            : language === "javascript"
            ? "index.js"
            : `index.${language}`
        return (
          <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 mt-2">
            <div
              className="flex items-center gap-2 p-1 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <span className="text-xs">{filename}</span>
              <span className="text-xs text-green-600">+{linesCount}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                lines
              </span>
              {isCollapsed ? (
                <ChevronDownIcon className="w-3.5 h-3.5 ml-auto text-zinc-500" />
              ) : (
                <ChevronUpIcon className="w-3.5 h-3.5 ml-auto text-zinc-500" />
              )}
            </div>
            <div className={isCollapsed ? "hidden" : ""}>
              <pre className="!m-0">
                <code className={`language-${language}`}>{children}</code>
              </pre>
            </div>
          </div>
        )
      }

      return (
        <pre
          {...(props as React.HTMLAttributes<HTMLPreElement>)}
          className={`${className} w-[80dvw] md:max-w-[500px] overflow-x-scroll bg-zinc-100 p-3 rounded-lg mt-2 dark:bg-zinc-800`}
        >
          <code className={`language-${language}`}>{children}</code>
        </pre>
      )
    },
    "internal-link": ({ node, "data-id": dataId, "data-title": dataTitle, ...props }: any) => {
      return (
        <Badge
          className="inline-flex items-center gap-1 px-1.5 py-0.5 cursor-pointer hover:opacity-80 transition-opacity"
          title={`ID: ${dataId}`}
          onClick={() => {
            handleInternalLinkClick(dataId)
          }}
          {...props}
        >
          <LinkIcon className="w-3 h-3" />
          <span className="min-w-0 flex-1">{dataTitle}</span>
        </Badge>
      )
    },
    "llm-response": ({
      children,
      language = "markdown",
      title,
      ...props
    }: any) => {
      const codeRef = useRef<HTMLElement>(null)

      useEffect(() => {
        if (codeRef.current) {
          Prism.highlightElement(codeRef.current)
        }
      }, [children, language])

      return (
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg my-4">
          <pre className="p-4 overflow-x-auto bg-zinc-50 dark:bg-zinc-900 !m-0">
            <code ref={codeRef} className={`language-${language}`}>
              {children}
            </code>
          </pre>
        </div>
      )
    },
    ol: ({ node, children, ...props }: any) => {
      return (
        <ol className="list-decimal list-outside ml-4" {...props}>
          {children}
        </ol>
      )
    },
    li: ({ node, children, ...props }: any) => {
      return (
        <li className="py-1" {...props}>
          {children}
        </li>
      )
    },
    ul: ({ node, children, ...props }: any) => {
      return (
        <ul className="list-decimal list-outside ml-4" {...props}>
          {children}
        </ul>
      )
    },
    strong: ({ node, children, ...props }: any) => {
      return (
        <span className="font-semibold" {...props}>
          {children}
        </span>
      )
    },
    a: ({ node, children, ...props }: any) => {
      return (
        <a
          className="text-blue-500 hover:underline"
          target="_blank"
          rel="noreferrer"
          {...props}
        >
          {children}
        </a>
      )
    },
    h1: ({ node, children, ...props }: any) => {
      return (
        <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
          {children}
        </h1>
      )
    },
    h2: ({ node, children, ...props }: any) => {
      return (
        <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
          {children}
        </h2>
      )
    },
    h3: ({ node, children, ...props }: any) => {
      return (
        <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
          {children}
        </h3>
      )
    },
    h4: ({ node, children, ...props }: any) => {
      return (
        <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
          {children}
        </h4>
      )
    },
    h5: ({ node, children, ...props }: any) => {
      return (
        <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
          {children}
        </h5>
      )
    },
    h6: ({ node, children, ...props }: any) => {
      return (
        <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
          {children}
        </h6>
      )
    },
  } as any

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkInternalLinks]}
      rehypePlugins={[rehypeRaw]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  )
}

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
)
