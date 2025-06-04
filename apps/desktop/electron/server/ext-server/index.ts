import { log } from 'electron-log';
import { getOrSetDataSpace } from '../../data-space'; // Assuming data-space.ts is in the parent directory
import { generateImportMap, getAllLibs, makeSdkInjectScript, twConfig } from './helper';
import { getIndexHtml } from './ext-html';

import tailwindRaw from './js/tailwind-raw.js?raw'
import appWrapperRaw from './js/app-wrapper.js?raw'
import sw from './js/sw.js?raw'

import fs from 'fs';
import path from 'path';

// curl http://287c3686-f1e1-4b10-965e-2daa35a422fc.ext.25-w19.eidos.localhost:13127/
// Middleware to intercept <extensionId>.ext.<spaceId>.eidos.localhost requests


// server static files from dist/compiled-ui at path /ui
export const interceptExtensionRequest = (dist: string, port: number) => async (c: any, next: any) => {
    const url = new URL(c.req.url);
    const hostname = url.hostname;

    const headers = new Headers()
    headers.append("Content-Type", 'text/javascript')
    headers.append("Cross-Origin-Embedder-Policy", "require-corp")

    if (url.pathname.startsWith('/compiled-ui')) {
        const file = fs.readFileSync(path.join(dist, url.pathname))
        return c.body(file, {
            headers
        });
    }
    if (url.pathname.startsWith('/sw.js')) {
        return new Response(sw, { headers })
    }
    // Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/plain". Strict MIME type checking is enforced for module scripts per HTML spec.
    if (url.pathname.startsWith('/app-wrapper.js')) {
        return new Response(appWrapperRaw, { headers })
    }
    if (url.pathname.startsWith('/tailwind-raw.js')) {
        return new Response(tailwindRaw, { headers })
    }
    // Regex to match <extensionId>.ext.<spaceId>.eidos.localhost
    // myext.ext.25-w19.eidos.localhost
    const match = hostname.match(/^([a-zA-Z0-9-]+)\.ext\.(.*)\.eidos\.localhost$/);



    if (match) {
        const extensionId = match[1];
        const spaceId = match[2];

        // if pathname is /<spaceId>/files/*
        if (url.pathname.startsWith('/' + spaceId + '/files/')) {
            // const file = fs.readFileSync(path.join(dist, url.pathname))
            // redirect to localhost:13127
            return c.redirect(`http://localhost:13127${url.pathname}`)
        }
        console.log('interceptExtensionRequest', c.req.url)
        // log(`Intercepted request for extension: ${extensionId}, space: ${spaceId} on host: ${hostname}`);
        try {
            const dataSpace = await getOrSetDataSpace(spaceId);
            const extension = await dataSpace.script.get(extensionId);
            //     log('Successfully got dataSpace for:', spaceId, 'DB Name:', dataSpace.dbName);
            const theme = 'light'
            const start = performance.now()
            const sdkInjectScriptContent = makeSdkInjectScript({
                space: spaceId,
                bindings: extension?.bindings,
            })
            const code = extension?.ts_code || ""
            const compiledCode = extension?.code || ""

            if (url.pathname.startsWith('/app.js')) {
                return c.body(compiledCode, {
                    headers
                });
            }

            const { thirdPartyLibs, uiLibs, cssLibs } = getAllLibs(code)
            // // preload some libs
            thirdPartyLibs.push(
                "@radix-ui/react-icons",
                "@radix-ui/react-toast",
                "class-variance-authority",
                "lucide-react"
            )
            uiLibs.push("toast", "toaster", "use-toast")
            const envString = extension?.env_map ? JSON.stringify(extension.env_map) : "{}"
            const defaultPropsString = JSON.stringify({})
            const { importMapScript, cssLoaderScript } = await generateImportMap(thirdPartyLibs, uiLibs, cssLibs)
            // // Placeholder for BlockRenderer server-side logic
            const html = getIndexHtml({
                theme,
                importMap: importMapScript,
                cssLoaderScript,
                sdkInjectScriptContent,
                envString,
                twConfig,
                compiledCode,
                defaultPropsString
            })

            const end = performance.now()
            console.log(`Time taken: ${end - start} milliseconds`)
            const htmlResponseHeaders = new Headers();
            // Allow this page to frame content from any http://localhost:* origin
            htmlResponseHeaders.append('Content-Security-Policy', "frame-src 'self' http://localhost:*;");
            // It's also good practice to set COOP
            htmlResponseHeaders.append('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
            // Cross-Origin-Resource-Policy: cross-origin
            htmlResponseHeaders.append('Cross-Origin-Resource-Policy', 'cross-origin');
            return c.html(html, { headers: htmlResponseHeaders });
        } catch (error: any) {
            log(`Error processing request for ${hostname}: ${error.message}`);
            return c.text(`Error processing request: ${error.message}`, 500);
        }
    }

    // If the hostname doesn't match, proceed to the next middleware or route handler.
    await next();
}

