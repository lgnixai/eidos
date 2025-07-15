import { log } from 'electron-log';

import type { Context } from 'hono';
import type { BlankEnv } from 'hono/types';
import { makeSdkInjectScript } from './helper';

// Function type for getting script code - this will be injected by the caller
type GetScriptCodeFunction = (spaceId: string, scriptId: string) => Promise<string | null>;


type Ctx = Context<BlankEnv, "*", {}>;

export class ScriptSandboxHandler {
    private getScriptCode: GetScriptCodeFunction | null = null;

    constructor(getScriptCode?: GetScriptCodeFunction) {
        this.getScriptCode = getScriptCode || null;
    }

    /**
     * Handle sandbox.<spaceId>.eidos.localhost requests
     * This provides a secure sandbox environment for script execution
     * and also serves script files directly from the database
     */
    async handleSandboxRequest(spaceId: string, url: URL, c: Ctx): Promise<Response> {
        try {
            log(`Handling sandbox request for space: ${spaceId}, URL: ${url.toString()}`);

            // Handle script file requests: sandbox.<spaceId>.eidos.localhost/scriptid.js
            if (url.pathname.endsWith('.js')) {
                return this.serveScriptFile(spaceId, url, c);
            }

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

    /**
     * Serve script file from database
     * Handles requests like: sandbox.<spaceId>.eidos.localhost/scriptid.js
     */
    private async serveScriptFile(spaceId: string, url: URL, c: Ctx): Promise<Response> {
        const scriptId = url.pathname.slice(1, -3); // Remove leading '/' and trailing '.js'

        // Validate script ID: should not contain '/' (no nested paths) and should not be empty
        if (!scriptId || scriptId.includes('/')) {
            return c.text('Invalid script ID', 400);
        }

        if (!this.getScriptCode) {
            return c.text('Script code provider not configured', 500);
        }

        try {
            const compiledCode = await this.getScriptCode(spaceId, scriptId);

            if (!compiledCode) {
                return c.text(`Script not found: ${scriptId}`, 404);
            }

            const headers = new Headers();
            headers.append("Content-Type", 'text/javascript');
            headers.append("Cross-Origin-Embedder-Policy", "require-corp");

            return c.body(compiledCode, { headers });
        } catch (error: any) {
            log(`Error serving script file ${scriptId} for space ${spaceId}: ${error.message}`);
            return c.text(`Error serving script: ${error.message}`, 500);
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
