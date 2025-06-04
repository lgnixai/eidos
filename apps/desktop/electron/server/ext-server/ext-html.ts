import type { Config } from "tailwindcss"
import themeRawCode from "./theme-raw.css?raw"

export const
  getIndexHtml = (props: {
    theme: string, importMap: string, cssLoaderScript: string, sdkInjectScriptContent: string, envString: string, twConfig: Partial<Config>, compiledCode: string, defaultPropsString: string
  }) => {
    const { theme, importMap, cssLoaderScript, sdkInjectScriptContent, envString, twConfig, compiledCode, defaultPropsString } = props
    return `<html class="${theme}">
      <head>
        ${importMap}
        <script src="/tailwind-raw.js"></script>
        ${sdkInjectScriptContent}
        ${cssLoaderScript}
        <script>
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
            }
        </script>
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
          document.addEventListener('click', function(event) {
            const link = event.target.closest('a');
            if (link && link.href) {
              event.preventDefault();
              if (link.href.hostname !== window.location.hostname) {
                window.open(link.href, '_blank');
              }
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
        <div id="root" style="height: 100%"></div>
        <script src="/app-wrapper.js" type="module"></script>
      </body>
    </html>
    `
  }