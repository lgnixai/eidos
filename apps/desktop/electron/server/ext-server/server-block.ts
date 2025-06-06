import { getOrSetDataSpace } from "../../data-space";
import { getIndexHtml } from "./ext-html";
import { generateImportMap, getAllLibs, makeSdkInjectScript, twConfig } from "./helper";
// import { generateImportMap, getAllLibs, makeSdkInjectScript, twConfig } from "./helper";
import { IExtension } from "@/packages/core/meta-table/extension";
import { DataSpace } from '@/packages/core/DataSpace';
import vm from 'vm';
import { extractFunction } from "@/lib/v3/extract-function";


export const runServerAction = async (code: string, dataSpace: DataSpace, url: string) => {
    const sandbox = {
        console: { log: console.log },
        context: {
            currentSpace: dataSpace,
            request: {
                url,
            },
        },
        URL: URL,
    };
    vm.createContext(sandbox);
    const res = await vm.runInNewContext(code, sandbox, {
        timeout: 3000,
    });
    return res
}

export class ServerBlock {
    constructor(
    ) {
    }

    async handleServerAction(code: string, dataSpace: DataSpace, url: string) {
        const serverActionFunctionRawCode = extractFunction(code, 'getServerSideProps')
        if (serverActionFunctionRawCode) {
            const serverActionCode = `(${serverActionFunctionRawCode})(context)`
            try {
                const res = await runServerAction(serverActionCode, dataSpace, url)
                return res
            } catch (error) {
                console.error("Error running server action", error)
            }
        }
        return null
    }

    async run(spaceId: string, extension: IExtension | null, url: string) {
        //     log('Successfully got dataSpace for:', spaceId, 'DB Name:', dataSpace.dbName);
        const theme = 'light'
        const dataSpace = await getOrSetDataSpace(spaceId);
        const start = performance.now()
        const sdkInjectScriptContent = makeSdkInjectScript({
            space: spaceId,
            bindings: extension?.bindings,
        })
        const code = extension?.ts_code || ""
        const compiledCode = extension?.code || ""

        const { thirdPartyLibs, uiLibs, cssLibs } = getAllLibs(code)
        const res = await this.handleServerAction(code, dataSpace, url)
        console.log("server action result", res)
        // // preload some libs
        thirdPartyLibs.push(
            "@radix-ui/react-icons",
            "@radix-ui/react-toast",
            "class-variance-authority",
            "lucide-react"
        )
        uiLibs.push("toast", "toaster", "use-toast")
        const envString = extension?.env_map ? JSON.stringify(extension.env_map) : "{}"
        const defaultPropsString = JSON.stringify({})
        const { importMapScript, cssLoaderScript } = await generateImportMap(thirdPartyLibs, uiLibs, cssLibs)
        // // Placeholder for BlockRenderer server-side logic
        const html = getIndexHtml({
            theme,
            importMap: importMapScript,
            cssLoaderScript,
            sdkInjectScriptContent,
            envString,
            twConfig,
            compiledCode,
            defaultPropsString,
            serverSideProps: res?.props || {}
        })
        const end = performance.now()
        console.log(`ServerBlock took ${end - start}ms`)
        return html
    }
}