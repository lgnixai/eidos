import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { useTheme } from "next-themes"

import { isDesktopMode } from "@/lib/env"
import { useThemeStore } from "@/lib/store/theme-store"
import { serializePropsToUrl } from "@/lib/utils"
import { generateImportMap, getAllLibs } from "@/lib/v3/compiler"
import { getThemeVariables } from "@/lib/web/theme"
import { useAllThemes } from "@/hooks/use-all-themes"
import { useCurrentPathInfo } from "@/hooks/use-current-pathinfo"

import { LogoLoading } from "../loading"
import { makeSdkInjectScript } from "../script-container/helper"
import { twConfig } from "./tailwind-config"
import tailwindRaw from "./tailwind-raw.js?raw"
import themeRawCode from "./theme-raw.css?raw"

export interface BlockRendererRef {
  getHeight: () => number
}

interface BlockRendererProps {
  code: string
  compiledCode: string
  blockId: string
  env?: Record<string, string>
  bindings?: Record<string, { type: "table"; value: string }>
  width?: string | number
  height?: string | number
  defaultProps?: Record<string, any>
  rerenderOnDefaultPropsChange?: boolean
}

export const BlockRenderer = React.forwardRef<
  BlockRendererRef,
  BlockRendererProps
>(
  (
    {
      code,
      compiledCode,
      blockId,
      env = {},
      width,
      height,
      defaultProps = {},
      bindings = {},
      rerenderOnDefaultPropsChange,
    },
    ref
  ) => {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [dependencies, setDependencies] = useState<string[]>([])
    const [uiComponents, setUiComponents] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(!isDesktopMode)
    const { space } = useCurrentPathInfo()
    const { theme } = useTheme()
    const { currentThemeName } = useThemeStore()
    const allThemes = useAllThemes()

    const themeVariables = useMemo(() => {
      const currentThemeDef = allThemes.find((t) => t.name === currentThemeName)
      if (currentThemeDef) {
        return getThemeVariables(currentThemeDef.css, theme === "dark")
      }
      return {}
    }, [allThemes, currentThemeName, theme])

    const webviewRef = useRef<HTMLWebViewElement | null>(null)
    const [importMap, setImportMap] = useState<string>("")
    const [extUrl, setExtUrl] = useState<string>(
      serializePropsToUrl(
        defaultProps,
        `http://${blockId}.ext.${space}.eidos.localhost:13127/`
      )
    )

    const defaultPropsString = JSON.stringify(defaultProps)

    useEffect(() => {
      if (!code.length || isDesktopMode) {
        return
      }
      const { thirdPartyLibs, uiLibs } = getAllLibs(code)
      // preload some libs
      thirdPartyLibs.push(
        "@radix-ui/react-icons",
        "@radix-ui/react-toast",
        "class-variance-authority",
        "lucide-react"
      )
      uiLibs.push("toast", "toaster", "use-toast")
      setDependencies(thirdPartyLibs)
      setUiComponents(uiLibs)
      generateImportMap(thirdPartyLibs, uiLibs).then(({ importMap }) => {
        setImportMap(importMap)
        setIsLoading(false)
      })
    }, [code])

    const envString = env ? JSON.stringify(env) : "{}"

    const rootHeight = height
      ? typeof height === "number"
        ? `${height}px`
        : height
      : "min-content"

    useEffect(() => {
      if (!iframeRef.current) return
      if (isDesktopMode) {
        iframeRef.current.src = `http://${blockId}.ext.${space}.eidos.localhost:13127/`
        return
      }

      const sdkInjectScriptContent = makeSdkInjectScript({
        space,
        bindings,
      })

      const html = `
      <!DOCTYPE html>
      <html class="${theme}">
        <head>
          ${importMap}
          <script>${tailwindRaw}</script>
          ${sdkInjectScriptContent}
          <script>
            window.process = {
              env: ${envString}
            };
            window.addEventListener('error', function(e) {
              console.error('Runtime error:', e);
            });
            window.addEventListener('unhandledrejection', function(e) {
              console.error('Unhandled Promise Rejection:', e);
            });
            window.addEventListener('message', (event) => {
              if (event.data.type === 'theme-change') {
                document.documentElement.className = event.data.theme;
              }
            });
          </script>
          <style>
            ${themeRawCode}
            * {
              border-color: hsl(var(--border));
            }

            body {
              background-color: hsl(var(--background));
              color: hsl(var(--foreground));
              margin: 0;
              padding: 0;
            }

            #loading {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: hsl(var(--background));
              transition: opacity 0.2s;
              font-family: monospace;
              font-size: 16px;
            }

            #loading::after {
              content: '...';
              animation: dots 1.5s steps(4, end) infinite;
              width: 1.5em;
              display: inline-block;
              text-align: left;
            }

            @keyframes dots {
              0%, 20% { content: ''; }
              40% { content: '.'; }
              60% { content: '..'; }
              80%, 100% { content: '...'; }
            }
          </style>
          <script>
            tailwind.config = ${JSON.stringify(twConfig)};
          </script>
        </head>
        <body>
          <div id="loading">Loading</div>
          <div id="root" style="height: ${rootHeight}"></div>
          <script type="module">
            import React from 'react';
            import { createRoot } from 'react-dom/client';
            import { Toaster } from "@/components/ui/toaster"
            
            let retryCount = 0;
            const maxRetries = 3;
            
            const executeCode = async () => {
              try {
                const codeStr = ${JSON.stringify(compiledCode)};
                
                const codeModule = new Blob(
                  [codeStr],
                  { type: 'text/javascript' }
                );
                
                const moduleUrl = URL.createObjectURL(codeModule);
                const moduleExports = await import(moduleUrl);
                URL.revokeObjectURL(moduleUrl);

                let MyComponent = moduleExports.default;

                if (!MyComponent) {
                  MyComponent = Object.values(moduleExports).find(
                    (exported) => typeof exported === 'function'
                  );
                }

                if (!MyComponent) {
                  throw new Error("Make sure to export a default component or a function");
                }

                const rootElement = document.getElementById('root');
                if (!rootElement) {
                  throw new Error("Root element not found");
                }

                const root = createRoot(rootElement);
                const props = ${defaultPropsString};
                
                root.render(
                  React.createElement(
                    React.StrictMode,
                    null,
                    [
                      React.createElement(MyComponent, props),
                      React.createElement(Toaster)
                    ]
                  )
                );

                document.getElementById('loading').style.opacity = '0';
                setTimeout(() => {
                  document.getElementById('loading').style.display = 'none';
                }, 200);

              } catch (err) {
                console.error('Execution error:', err);
                console.error('Error stack:', err.stack);
                if (retryCount < maxRetries) {
                  retryCount++;
                  console.log(\`Retrying... Attempt \${retryCount} of \${maxRetries}\`);
                  const loadingEl = document.getElementById('loading');
                  loadingEl.style.opacity = '1';
                  loadingEl.style.display = 'flex';
                  setTimeout(executeCode, 1000); 
                  return;
                }
                
                const errorElement = document.createElement('div');
                errorElement.style.color = 'red';
                errorElement.style.padding = '1rem';
                errorElement.style.fontFamily = 'monospace';
                errorElement.textContent = \`\${err.message}\\n\${err.stack}\`;
                document.body.appendChild(errorElement);
                
                document.getElementById('loading').style.display = 'none';
              }
            };

            executeCode().catch(err => {
              console.error('Top level error:', err);
              document.getElementById('loading').style.display = 'none';
            });
          </script>
        </body>
      </html>
    `

      iframeRef.current.srcdoc = html
    }, [
      compiledCode,
      dependencies,
      uiComponents,
      importMap,
      env,
      defaultPropsString,
    ])

    useEffect(() => {
      if (!iframeRef.current) return
      iframeRef.current.contentWindow?.postMessage(
        { type: "theme-change", theme, variables: themeVariables },
        "*"
      )
    }, [theme, themeVariables])

    useEffect(() => {
      if (!iframeRef.current) return
      iframeRef.current.contentWindow?.postMessage(
        { type: "props-change", props: defaultProps },
        "*"
      )
    }, [defaultProps])

    useEffect(() => {
      if (!webviewRef.current) return
      webviewRef.current.contentWindow?.postMessage(
        { type: "props-change", props: defaultProps },
        "*"
      )
    }, [defaultProps])

    // theme change
    useEffect(() => {
      if (!webviewRef.current) return
      webviewRef.current.contentWindow?.postMessage(
        { type: "theme-change", theme, variables: themeVariables },
        "*"
      )
    }, [theme, themeVariables])

    useEffect(() => {
      if (!webviewRef.current) return
      webviewRef.current.addEventListener("dom-ready", () => {
        setTimeout(() => {
          webviewRef.current?.contentWindow?.postMessage(
            JSON.stringify({ type: "props-change", props: defaultProps })
          )
        }, 5000)
      })
    }, [])

    useImperativeHandle(
      ref,
      () => ({
        getHeight: () => {
          if (!iframeRef.current) return 0
          return (
            iframeRef.current.contentWindow?.document.getElementById("root")
              ?.offsetHeight || 0
          )
        },
      }),
      []
    )

    useEffect(() => {
      const url = serializePropsToUrl(
        defaultProps,
        `http://${blockId}.ext.${space}.eidos.localhost:13127/`
      )
      if (url !== extUrl) {
        setExtUrl(url)
      }
      // do not listen to defaultProps changes, avoid webview repeating props-change messages
      // the message mechanism can ensure subsequent changes are passed
    }, [blockId, space])

    useEffect(() => {
      if (rerenderOnDefaultPropsChange) {
        const url = serializePropsToUrl(
          defaultProps,
          `http://${blockId}.ext.${space}.eidos.localhost:13127/`
        )
        if (url !== extUrl) {
          setExtUrl(url)
        }
      }
    }, [blockId, space, extUrl, defaultProps, rerenderOnDefaultPropsChange])

    const style = {
      border: "none",
      display: "block",
      width: width
        ? typeof width === "number"
          ? `${width}px`
          : width
        : "100%",
      height: height
        ? typeof height === "number"
          ? `${height}px`
          : height
        : "100%",
    }
    if (isLoading) {
      return (
        <div className="flex items-center justify-center" style={style}>
          <LogoLoading />
        </div>
      )
    }
    if (isDesktopMode) {
      return (
        <webview
          ref={webviewRef}
          src={extUrl.toString()}
          style={{
            minHeight: height,
            minWidth: width,
          }}
          autosize
        />
      )
    }

    return (
      <iframe
        ref={iframeRef}
        title="preview"
        name={defaultPropsString}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
        style={style}
      />
    )
  }
)
