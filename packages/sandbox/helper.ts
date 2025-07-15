import sdkInjectScript from "./sdk-inject-script.html?raw";
import type { IBindings } from "@/packages/core/types/IExtension";


export const makeSdkInjectScript = ({
    bindings,
    space,
}: {
    bindings?: IBindings
    space: string
}) => {
    let res = sdkInjectScript.replace("${{currentSpace}}", space)
    if (bindings) {
        res = `<script>window.__EIDOS_BINDINGS__ = ${JSON.stringify(bindings)}</script>` + res
    }
    return res
}