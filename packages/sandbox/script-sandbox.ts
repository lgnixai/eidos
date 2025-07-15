import { log } from 'electron-log';

import type { Context } from 'hono';
import type { BlankEnv } from 'hono/types';
import { makeSdkInjectScript } from './helper';


type Ctx = Context<BlankEnv, "*", {}>;

export class ScriptSandboxHandler {
    constructor() { }

    /**
     * Handle sandbox.<spaceId>.eidos.localhost requests
     * This provides a secure sandbox environment for script execution
     */
    async handleSandboxRequest(spaceId: string, url: URL, c: Ctx): Promise<Response> {
        try {
            log(`Handling sandbox request for space: ${spaceId}, URL: ${url.toString()}`);
            // Handle different sandbox endpoints
            if (url.pathname === '/') {
                return this.serveSandboxHTML(spaceId, c);
            }
            // Default response for unhandled paths
            return c.text('Sandbox endpoint not found', 404);

        } catch (error: any) {
            log(`Error handling sandbox request for space ${spaceId}: ${error.message}`);
            return c.text(`Sandbox error: ${error.message}`, 500);
        }
    }

    private serveSandboxHTML(spaceId: string, c: Ctx): Response {
        const sdkInjectScriptContent = makeSdkInjectScript({
            space: spaceId,
        })
        const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Eidos Script Container</title>
    ${sdkInjectScriptContent}
  </head>
  <body>
    <p id="message">Loading...</p>
  </body>
</html>
        `;

        // Set permissive headers for sandbox HTML
        const headers = new Headers();
        headers.set('Content-Type', 'text/html; charset=utf-8');
        headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        headers.set('Access-Control-Allow-Headers', '*');

        return c.html(html, { headers });
    }
}
