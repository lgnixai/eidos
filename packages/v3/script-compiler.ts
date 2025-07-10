import type { IExtension } from "@/packages/core/meta-table/extension";
import { compileCode } from "./compiler";
import { compileLexicalCode } from "./lexical-compiler";
import * as oxc from "oxc-transform";

export const scriptCodeCompile = async (
    sourceCode: string
): Promise<string> => {
    try {
        const result = oxc.transform(
            'source.ts',
            sourceCode,
            {
                typescript: {}
            }
        );

        if (result.errors && result.errors.length > 0) {
            const errorMessages = result.errors.map((err: any) => err.message || err.toString()).join('\n');
            throw new Error(errorMessages);
        }

        return result.code;
    } catch (err: any) {
        throw new Error(err.message)
    }
};

async function blockCodeCompile(ts_code: string): Promise<string> {
    const result = await compileCode(ts_code);
    if (result.error) {
        console.error("Error compiling block code:", result.error);
        throw new Error(result.error);
    }
    return result.code;
}

async function pythonCodeCompile(code: string): Promise<string> {
    // Assuming python code does not need compilation in this context
    return code;
}

async function lexicalCodeCompile(ts_code: string): Promise<string> {
    const result = await compileLexicalCode(ts_code);
    if (result.error) {
        console.error("Error compiling lexical code:", result.error);
        throw new Error(result.error);
    }
    return result.code;
}

export async function compileScript(
    script: { type: string, ts_code: string, code: string }
): Promise<string> {
    const ts_code = script.ts_code;
    const code = script.code;

    const compileMethod = getCompileMethod(script)
    if (!compileMethod) {
        return code || ""
    }
    return compileMethod(ts_code || code || "")
}

export function getCompileMethod(script: { type: string }) {
    return getCompileMethodByScriptType(script.type)
}

export function getCompileMethodByScriptType(scriptType: string) {
    // Legacy support for old types
    if (scriptType === "py_script") {
        return pythonCodeCompile;
    }
    if (scriptType === "doc_plugin") {
        return lexicalCodeCompile;
    }
    if (scriptType === "m_block") {
        return blockCodeCompile;
    }

    // New architecture types
    if (scriptType === "script") {
        return scriptCodeCompile;
    }
    if (scriptType === "block") {
        return blockCodeCompile;
    }

    return undefined
}