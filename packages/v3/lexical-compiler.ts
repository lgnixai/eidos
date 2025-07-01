import * as oxc from "oxc-transform";

const BUILT_IN_PACKAGES = [
    "react",
    "lexical",
    "@lexical/utils",
    "@lexical/markdown",
    "@lexical/react/LexicalComposerContext",
    "@lexical/react/LexicalBlockWithAlignableContents",
] as const;

interface CompileResult {
    code: string;
    error: string | null;
}

function createGlobalVarName(packageName: string): string {
    return `__${packageName.toUpperCase()}`;
}

function processLexicalImports(sourceCode: string): string {
    let processedCode = sourceCode;

    BUILT_IN_PACKAGES.forEach((packageName) => {
        const globalVarName = createGlobalVarName(packageName);

        // 处理混合导入: import DefaultExport, { namedExport } from 'package'
        processedCode = processedCode.replace(
            new RegExp(`import\\s+([^\\s{]+)\\s*,\\s*{([^}]+)}\\s*from\\s*['"]${packageName}['"]\\s*;?`, 'g'),
            `const $1 = window["${globalVarName}"];\nconst {$2} = window["${globalVarName}"];`
        );

        // 处理命名导入: import { a, b } from 'package'
        processedCode = processedCode.replace(
            new RegExp(`import\\s*{([^}]+)}\\s*from\\s*['"]${packageName}['"]\\s*;?`, 'g'),
            `const {$1} = window["${globalVarName}"];`
        );

        // 处理默认导入: import xxx from 'package'
        processedCode = processedCode.replace(
            new RegExp(`import\\s+([^\\s{]+)\\s+from\\s*['"]${packageName}['"]\\s*;?`, 'g'),
            `const $1 = window["${globalVarName}"];`
        );
    });

    return processedCode;
}

export async function compileLexicalCode(sourceCode: string): Promise<CompileResult> {
    try {
        const processedCode = processLexicalImports(sourceCode);

        const result = oxc.transform(
            'source.tsx',
            processedCode,
            {
                typescript: {}
            }
        );

        if (result.errors && result.errors.length > 0) {
            const errorMessages = result.errors.map((err: any) => err.message || err.toString()).join('\n');
            return { code: "", error: errorMessages };
        }

        return {
            code: result.code,
            error: null,
        };
    } catch (err: any) {
        return {
            code: "",
            error: err.message
        };
    }
} 