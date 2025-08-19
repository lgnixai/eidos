import type { IExtension } from "@/packages/core/types/IExtension"
import { useNavigate } from "react-router-dom"

import { useCurrentPathInfo } from "@/apps/web-app/hooks/use-current-pathinfo"
import { generateIdV7 } from "@/lib/utils"

import { useExtension } from "@/apps/web-app/hooks/use-extension"
import { useExtensionSidebarStore } from "../stores/sidebar-store"

// Script templates
import emptyScriptTemplate from "./templates/script/empty.ts?raw"
import tableActionTemplate from "./templates/script/table-action.ts?raw"
import toolTemplate from "./templates/script/tool.ts?raw"
import udfTemplate from "./templates/script/udf.ts?raw"

// Block templates
import { extractConstant } from "@/packages/v3/code-tools/code-extractor"
import { blockCodeCompile, scriptCodeCompile } from "@/packages/v3/script-compiler"
import emptyBlockTemplate from "./templates/block/empty.tsx?raw"
import extNodeTemplate from "./templates/block/ext-node.tsx?raw"
import tableViewTemplate from "./templates/block/table-view.tsx?raw"



export const useNewExtension = () => {
  const { addExtension } = useExtension()
  const router = useNavigate()
  const { space } = useCurrentPathInfo()
  const { setFocusedExtensionId } = useExtensionSidebarStore()

  const handleCreateNewExtension = async (
    template: "tool" | "udf" | "tableAction" | "tableView" | "extNode" | "emptyScript" | "emptyBlock" = "tool",
    type: "script" | "block" = template === "tableView" || template === "extNode" || template === "emptyBlock" ? "block" : "script"
  ) => {
    const newScriptId = generateIdV7()
    const shortSlug = newScriptId.slice(-8)

    // Tool Script (LLM Tool)
    const toolScript: IExtension = {
      id: newScriptId,
      slug: `tool-${shortSlug}`,
      name: `New Tool - ${shortSlug}`,
      type: type,
      description: "Tool Description",
      version: "0.0.1",
      code: await scriptCodeCompile(toolTemplate),
      ts_code: toolTemplate,
      meta: await extractConstant(toolTemplate, "meta")
      ,
    }

    // UDF Script (User-Defined Function)
    const udfScript: IExtension = {
      id: newScriptId,
      slug: `udf-${shortSlug}`,
      name: `myTwice`,
      type: type,
      description: "twice the input",
      version: "0.0.1",
      code: await scriptCodeCompile(udfTemplate),
      ts_code: udfTemplate,
      meta: await extractConstant(udfTemplate, "meta")
    }

    // Table Action Script
    const tableActionScript: IExtension = {
      id: newScriptId,
      slug: `table-action-${shortSlug}`,
      name: `Toggle Checked`,
      type: type,
      description: "Toggles the checked status of the selected record",
      version: "0.0.1",
      code: await scriptCodeCompile(tableActionTemplate),
      ts_code: tableActionTemplate,
      meta: await extractConstant(tableActionTemplate, "meta")
    }

    // Table View Block Extension
    const tableViewBlock: IExtension = {
      id: newScriptId,
      slug: `table-view-${shortSlug}`,
      name: `New Table View - ${shortSlug}`,
      type: type,
      description: "Custom table view",
      version: "0.0.1",
      code: await blockCodeCompile(tableViewTemplate),
      ts_code: tableViewTemplate,
      meta: await extractConstant(tableViewTemplate, "meta")
    }

    // Extension Node Block Extension
    const extNodeBlock: IExtension = {
      id: newScriptId,
      slug: `ext-node-${shortSlug}`,
      name: `New Ext Node - ${shortSlug}`,
      type: "block",
      description: "Custom extension node",
      version: "0.0.1",
      code: await blockCodeCompile(extNodeTemplate),
      ts_code: extNodeTemplate,
      meta: await extractConstant(extNodeTemplate, "meta")
    }

    // Empty Script Extension
    const emptyScript: IExtension = {
      id: newScriptId,
      slug: `script-${shortSlug}`,
      name: `New Script - ${shortSlug}`,
      type: type,
      description: "Empty script extension",
      version: "0.0.1",
      code: await scriptCodeCompile(emptyScriptTemplate),
      ts_code: emptyScriptTemplate,
      meta: undefined,
    }

    // Empty Block Extension
    const emptyBlock: IExtension = {
      id: newScriptId,
      slug: `block-${shortSlug}`,
      name: `New Block - ${shortSlug}`,
      type: type,
      description: "Empty block extension",
      version: "0.0.1",
      code: await blockCodeCompile(emptyBlockTemplate),
      ts_code: emptyBlockTemplate,
      meta: undefined,
    }

    const templateMap = {
      tool: toolScript,
      udf: udfScript,
      tableAction: tableActionScript,
      tableView: tableViewBlock,
      extNode: extNodeBlock,
      emptyScript: emptyScript,
      emptyBlock: emptyBlock,
    }

    const extension = templateMap[template]
    await addExtension(extension)

    // Set the focused extension ID to scroll to it in the sidebar
    setFocusedExtensionId(newScriptId)

    router(`/${space}/extensions/${newScriptId}`)
  }

  return {
    handleCreateNewExtension,
  }
}
