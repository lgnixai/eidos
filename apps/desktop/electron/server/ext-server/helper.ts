import sdkInjectScript from "./sdk-inject-script.html?raw";
import { transform } from "esbuild";
import { uiComponentsDependencies } from "./ui-deps";

import type { Config } from "tailwindcss"

interface CompileOptions {
    uiLibCode?: string;
}

interface CompileResult {
    code: string;
    error: string | null;
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


export const compileCode = async (
    sourceCode: string,
    options: CompileOptions = {}
): Promise<CompileResult> => {
    const { uiLibCode = "" } = options;

    try {
        const reactImportRegex =
            /import\s+(?:\*\s+as\s+)?React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"]/;
        const hasReactImport = reactImportRegex.test(sourceCode);

        const reactBanner = hasReactImport ? "" : `import React from 'react';\n`;

        const jsxResult = await transform(sourceCode, {
            loader: "tsx",
            target: "es2020",
            jsxFactory: "React.createElement",
            jsxFragment: "React.Fragment",
            banner: reactBanner + uiLibCode,
            minify: false,
            keepNames: true,
            charset: "utf8",
        });

        return {
            code: jsxResult.code,
            error: null,
        };
    } catch (err: any) {
        return { code: "", error: err.message };
    }
};

export function getImportsFromCode(code: string) {
    const importRegex = /import\s+[\s\S]*?\s+from\s+['"](.*?)['"];?/g;
    const imports = [];
    let match;

    while ((match = importRegex.exec(code)) !== null) {
        imports.push(match[1]);
    }

    return Array.from(new Set(imports));
}


const uiLibDeps = new Set([
    '@radix-ui/*',
    'recharts'
])

const HOST_URL = ''
export async function generateImportMap(
    thirdPartyLibs: string[],
    uiLibs: string[],
) {
    const REACT_VERSION = '18.3.1';

    const imports: Record<string, string> = {
        'react': `https://esm.sh/stable/react@${REACT_VERSION}`,
        'react/jsx-runtime': `https://esm.sh/stable/react@${REACT_VERSION}/jsx-runtime`,
        'react-dom': `https://esm.sh/stable/react-dom@${REACT_VERSION}`,
        'react-dom/client': `https://esm.sh/stable/react-dom@${REACT_VERSION}/client`,
        clsx: "https://esm.sh/clsx@2.1.1",
        "tailwind-merge": "https://esm.sh/tailwind-merge",
        "@/lib/utils": `${HOST_URL}/compiled-ui/utils.js`,
    };

    thirdPartyLibs.forEach((dep) => {
        if (dep === "react" || dep === "react-dom") return;

        // Check if the dependency matches any pattern in uiLibDeps
        const shouldExternalizeReact = Array.from(uiLibDeps).some(pattern => {
            if (pattern.endsWith('*')) {
                const prefix = pattern.slice(0, -1);
                return dep.startsWith(prefix);
            }
            return dep === pattern;
        });

        if (shouldExternalizeReact) {
            imports[dep] = `https://esm.sh/${dep}?external=react&alias=react@${REACT_VERSION}`;
        } else {
            imports[dep] = `https://esm.sh/${dep}?deps=react@${REACT_VERSION}`;
        }
    });


    for (const dep of uiLibs) {
        let componentId = `@/components/ui/${dep}`;
        if (dep.startsWith("use-")) {
            componentId = `@/hooks/${dep}`;
        }
        imports[componentId] = `${HOST_URL}/compiled-ui/${dep}.js`;
    }

    const importMapScript = `
  <script type="importmap">
    ${JSON.stringify({ imports }, null, 2)}
  </script>
  `;

    console.debug('Import Map:', JSON.stringify({
        thirdPartyLibs,
        uiLibs,
        imports,
        importMapScript
    }, null, 2));

    return {
        importMap: importMapScript,
        cleanup: () => {
        },
    };
}

export function getAllLibs(code: string, processedComponents = new Set<string>()) {
    if (!code) return {
        thirdPartyLibs: [],
        uiLibs: [],
    }

    const dependencies = getImportsFromCode(code);
    const thirdPartyLibs =
        dependencies?.filter((dep) => !dep.startsWith("@/")) ?? [];
    const uiLibs =
        dependencies
            ?.filter((dep) => dep.startsWith("@/components/ui"))
            .map((dep) => dep.replace("@/components/ui/", "")) ?? [];

    for (const component of uiLibs) {
        if (processedComponents.has(component)) continue;
        processedComponents.add(component);
        const { thirdPartyLibs: _thirdPartyLibs, uiLibs: _uiLibs } = uiComponentsDependencies[component as keyof typeof uiComponentsDependencies];
        thirdPartyLibs.push(..._thirdPartyLibs);
        uiLibs.push(..._uiLibs);
    }

    return {
        thirdPartyLibs: Array.from(new Set(thirdPartyLibs)),
        uiLibs: Array.from(new Set(uiLibs)),
    };
}




export const twConfig: Partial<Config> = {
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar-background))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    primary: "hsl(var(--sidebar-primary))",
                    "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
                    accent: "hsl(var(--sidebar-accent))",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    ring: "hsl(var(--sidebar-ring))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: {
                        height: "0",
                    },
                    to: {
                        height: "var(--radix-accordion-content-height)",
                    },
                },
                "accordion-up": {
                    from: {
                        height: "var(--radix-accordion-content-height)",
                    },
                    to: {
                        height: "0",
                    },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
}