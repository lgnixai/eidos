import { getPythonWorker } from "@/lib/python/worker";
import type { DataSpace } from "@/packages/core/DataSpace";
import sdkInjectScript from "./sdk-inject-script.html?raw";


export type IScriptInput = Record<string, any>

export interface IScriptContext {
    tables: any
    env: Record<string, any>
    currentNodeId?: string | null
    currentRowId?: string | null
    currentViewId?: string | null
    currentViewQuery?: string | null
    callFromTableAction?: boolean
}

export const makeSdkInjectScript = ({
    bindings,
    space,
}: {
    bindings?: Record<string, { type: "table"; value: string }>
    space: string
}) => {
    let res = sdkInjectScript.replace("${{currentSpace}}", space)
    if (bindings) {
        res = `<script>window.__EIDOS_BINDINGS__ = ${JSON.stringify(bindings)}</script>` + res
    }
    return res
}

export interface IPythonScriptCallProps {
    input: Record<string, any>
    context: {
        tables: any
        env: Record<string, any>
        currentNodeId?: string | null
        currentRowId?: string | null
        currentViewId?: string | null
        currentViewQuery?: string | null
        callFromTableAction?: boolean
    }
    code: string
    command: string
    id: string
    bindings?: Record<string, any>
    dependencies?: string[]
}


// Helper function to handle JavaScript execution
export const callJavaScript = (
    props: {
        input: IScriptInput
        context: IScriptContext
        code: string
        command: string
        id: string
        bindings?: Record<string, any>
    },
    scriptContainerRef: any
): Promise<any> => {
    const channel = new MessageChannel()

    scriptContainerRef?.current?.contentWindow?.postMessage(
        {
            type: "ScriptFunctionCall",
            data: props,
        },
        "*",
        [channel.port2]
    )

    return new Promise((resolve, reject) => {
        channel.port1.onmessage = (event) => {
            const { type, data } = event.data
            if (type === "ScriptFunctionCallResponse") {
                resolve(data)
            } else if (type === "ScriptFunctionCallError") {
                reject(data)
            }
        }
    })
}

export const callPythonScript = (props: IPythonScriptCallProps): Promise<any> => {
    const pythonWorker = getPythonWorker()
    const channel = new MessageChannel()

    pythonWorker.postMessage(
        {
            type: "PythonScriptCall",
            payload: props,
        },
        [channel.port2]
    )

    return new Promise((resolve, reject) => {
        channel.port1.onmessage = (event) => {
            const { type, data } = event.data
            if (type === "PythonScriptCallResponse") {
                resolve(data.result)
            } else if (type === "PythonScriptCallError") {
                reject(data.error)
            }
        }
    })
}

export const callScriptById = async (id: string, input: Record<string, any>, sqlite: DataSpace, scriptContainerRef: any, cmd?: string) => {
    const script = await sqlite.getScript(id)
    if (!script) {
        throw new Error("Script not found")
    }
    if (script.type === "py_script") {
        return callPythonScript({
            input,
            code: script.code,
            id,
            context: {
                tables: script.tables,
                env: {},
            },
            command: cmd ?? 'main',
            dependencies: script.dependencies,
        })
    } else if (script.type === "script") {
        return callJavaScript({
            input,
            code: script.code,
            id,
            context: {
                tables: script.tables,
                env: {},
            },
            command: cmd ?? 'default',
        }, scriptContainerRef)
    }
}
