import { initialize } from "esbuild-wasm";
import wasmURL from 'esbuild-wasm/esbuild.wasm?url'

export let compilerInitialized = false
export const initializeCompiler = async () => {
    if (compilerInitialized) return
    try {
        await initialize({
            worker: true,
            wasmURL
        });
    } catch (error) {
        console.error(error)
        compilerInitialized = false
    }
    compilerInitialized = true
};

export { transform } from "esbuild-wasm";