
import type { Config } from "tailwindcss"

export const getIndexHtml = (props: {
  theme: string, importMap: string, sdkInjectScriptContent: string, envString: string, twConfig: Partial<Config>, compiledCode: string, defaultPropsString: string
}) => {
  const { theme, importMap, sdkInjectScriptContent, envString, twConfig, compiledCode, defaultPropsString } = props
  return `<html class="${theme}">
      <head>
        ${importMap}
        <script src="/tailwind-raw.js"></script>
        ${sdkInjectScriptContent}
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
        </script>
        <style>
            html,
            body {
            height: fit-content;
            }
    
            * {
            scrollbar-width: thin;
            /* Make the scrollbar narrower */
            scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
            /* Thumb and track colors */
            }
    
            :root {
            --background: 0 0% 100%;
            --foreground: 222.2 84% 4.9%;
            --card: 0 0% 100%;
            --card-foreground: 222.2 84% 4.9%;
            --popover: 0 0% 100%;
            --popover-foreground: 222.2 84% 4.9%;
            --primary: 222.2 47.4% 11.2%;
            --primary-foreground: 210 40% 98%;
            --secondary: 210 40% 96.1%;
            --secondary-foreground: 222.2 47.4% 11.2%;
            --muted: 210 40% 96.1%;
            --muted-foreground: 215.4 16.3% 46.9%;
            --accent: 210 40% 96.1%;
            --accent-foreground: 222.2 47.4% 11.2%;
            --destructive: 0 84.2% 60.2%;
            --destructive-foreground: 210 40% 98%;
            --border: 214.3 31.8% 91.4%;
            --input: 214.3 31.8% 91.4%;
            --ring: 222.2 84% 4.9%;
            --radius: 0.5rem;
            --chart-1: 12 76% 61%;
            --chart-2: 173 58% 39%;
            --chart-3: 197 37% 24%;
            --chart-4: 43 74% 66%;
            --chart-5: 27 87% 67%;
            }
    
            .dark {
            --background: 222.2 84% 4.9%;
            --foreground: 210 40% 98%;
            --card: 222.2 84% 4.9%;
            --card-foreground: 210 40% 98%;
            --popover: 222.2 84% 4.9%;
            --popover-foreground: 210 40% 98%;
            --primary: 210 40% 98%;
            --primary-foreground: 222.2 47.4% 11.2%;
            --secondary: 217.2 32.6% 17.5%;
            --secondary-foreground: 210 40% 98%;
            --muted: 217.2 32.6% 17.5%;
            --muted-foreground: 215 20.2% 65.1%;
            --accent: 217.2 32.6% 17.5%;
            --accent-foreground: 210 40% 98%;
            --destructive: 0 62.8% 30.6%;
            --destructive-foreground: 210 40% 98%;
            --border: 217.2 32.6% 17.5%;
            --input: 217.2 32.6% 17.5%;
            --ring: 212.7 26.8% 83.9%;
            --chart-1: 220 70% 50%;
            --chart-2: 160 60% 45%;
            --chart-3: 30 80% 55%;
            --chart-4: 280 65% 60%;
            --chart-5: 340 75% 55%;
            }
    
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