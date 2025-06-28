import { initialize, transform as esbuildTransform } from "esbuild-wasm";
import wasmURL from 'esbuild-wasm/esbuild.wasm?url'

let initializePromise: Promise<void> | null = null;

export const initializeCompiler = async () => {
    if (!initializePromise) {
        initializePromise = initialize({
            worker: true,
            wasmURL
        }).catch(error => {
            console.error('Failed to initialize esbuild:', error);
            initializePromise = null;
            throw error;
        });
    }
    return initializePromise;
};

export const transform = async (...args: Parameters<typeof esbuildTransform>) => {
    await initializeCompiler();
    return esbuildTransform(...args);
};