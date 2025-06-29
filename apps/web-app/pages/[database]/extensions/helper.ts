import z from "zod"

import { toast } from "@/components/ui/use-toast"
import type { IExtension } from "@/packages/core/meta-table/extension"
import { generateId, proxyURL } from "@/lib/utils"
import eidosTypes from "@/packages/core/dist/index.d.ts?raw"

import { parse } from "comment-parser"


export const getDescriptionFromCode = (code: string) => {
  const comments = parse(code)
  const comment = comments[0]
  return comment?.description
}

export const PromptEnableCheck = z.object({
  model: z.string().refine((value) => value.trim() !== "", {
    message: "Model cannot be empty",
    path: ["model"],
  }),
  actions: z.array(z.string()).nullable().optional(),
})

export const checkPromptEnable = (data: unknown) => {
  const result = PromptEnableCheck.safeParse(data)
  if (!result.success) {
    toast({
      title: `please check your settings`,
      description: `[${result.error.errors[0].path}]: ${result.error.errors[0].message}`,
    })
    throw new Error(result.error.errors[0].message)
  }
  return result.data
}

export const getEditorLanguage = (
  script: IExtension
): "markdown" | "typescript" | "javascript" | "typescriptreact" | "python" => {
  if (script.type === "prompt") {
    return "markdown"
  }

  if (script.type === "py_script") {
    return "python"
  }

  if (script.type === "m_block" || script.type === "doc_plugin") {
    return "typescriptreact"
  }
  if (script.ts_code) {
    return "typescript"
  }

  return "javascript"
}

function getRegistryUrl(path: string) {
  const url = new URL(path)
  if (url.pathname.match(/\/chat\/b\//) && !url.pathname.endsWith("/json")) {
    url.pathname = `${url.pathname}/json`
  }
  return url.toString()
}


interface RegistryFile {
  path: string
  type: string
  content: string
}

interface RegistryResponse {
  name: string
  type: string
  dependencies: string[]
  devDependencies: string[]
  registryDependencies: string[]
  files: RegistryFile[]
  tailwind: Record<string, any>
  cssVars: Record<string, any>
  meta: {
    importSpecifier: string
    moduleSpecifier: string
  }
}



export const getV0Block = async (link: string) => {
  /**
   * 1. https://v0.dev/chat/b/ZzbGuhRMKPX
   * 2. npx shadcn@latest add https://v0.dev/chat/b/ZzbGuhRMKPX
   * 3. npx shadcn@latest add "https://v0.dev/chat/b/ZzbGuhRMKPX"
   */
  const _link = link.trim()
    .replace(/^npx\s+shadcn@latest\s+add\s+/, '')
    .replace(/^["']|["']$/g, '')
    .trim()

  const url = getRegistryUrl(_link)
  console.log('Fetching URL:', url)
  const res = await fetch(proxyURL(url))
  const data = await res.json() as RegistryResponse
  return data.files[0]
}

export const getScriptFromV0 = async (link: string): Promise<IExtension> => {
  const data = await getV0Block(link)
  const newScriptId = generateId()

  // path to name "path": "components/github-release-stats.tsx",
  const name = data.path.split("/").pop()?.split(".")[0]
  const script: IExtension = {
    id: newScriptId,
    name: name ?? "New Block " + newScriptId,
    type: "m_block",
    version: "0.0.1",
    commands: [],
    description: "A block from v0",
    ts_code: data.content,
    code: '',
  }
  return script
}


export const getDynamicPrompt = (bindings: IExtension["bindings"]) => {
  const replaceText = `table(id: string): TableManager;`
  const bindingText = Object.entries(bindings || {})
    .map(([key, value]) => {
      return `${key}: TableManager;`
    })
    .join("\n")

  // Add global eidos variable declaration
  const eidosGlobalDeclaration = `
declare global {
  const eidos: Eidos;
}
`

  let replaced = eidosTypes.replace(replaceText, replaceText + "\n" + bindingText)
  // Add global eidos declaration at the end
  replaced = replaced + eidosGlobalDeclaration
  return replaced
}




export const getSuggestedActions = (type: IExtension["type"]) => {
  switch (type) {
    case "m_block":
      return [
        {
          title: "Change all buttons",
          label: "to red",
          action: "Change all buttons to red",
        },
        {
          title: "Show latest 10 issues",
          label: "from mayneyao/eidos",
          action: "Show latest 10 issues from mayneyao/eidos GitHub repository",
        },
      ]
    case "script":
      return [
        {
          title: "Show top 10 hacker news",
          label: "in notification",
          action: "Show top 10 hacker news in notification",
        },
      ]
    case "py_script":
      return [
        {
          title: "get the most popular repositories", //  
          label: "in the past 7 days on GitHub",
          action: `get the most popular GitHub repositories in the past 7 days.\n
- use data as function name, return a list of repositories.\n
- include the repository name, full name with owner, language, description, and the number of stars.\n
- use requests library to get the data from GitHub API.`,
        },
      ]
    case "doc_plugin":
      return [
        {
          title: "Emoji converter",
          label: "change :D to 🤣",
          action: "Make a Emoji converter plugin, which can change all :D to 🤣",
        },
      ]
    case "udf":
      return [
        {
          title: "Extract Email Domain",
          label: "from email address",
          action: "extract the domain from an email address",
        },
      ]
    default:
      return []
  }
}
