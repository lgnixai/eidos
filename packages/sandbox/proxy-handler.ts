import { log } from 'electron-log';
import type { Context } from 'hono';
import type { BlankEnv } from 'hono/types';

type Ctx = Context<BlankEnv, "*", {}>;

export class ProxyHandler {
    constructor() { }

    /**
     * Handle proxy requests for external URLs
     * This provides a secure proxy service for cross-origin requests
     */
    async handleProxyRequest(url: URL, c: Ctx): Promise<Response> {
        try {
            log(`Handling proxy request: ${url.toString()}`);
            
            // Get the target URL from query parameters
            const targetUrl = url.searchParams.get('url');
            
            if (!targetUrl) {
                return c.text('Missing target URL parameter', 400);
            }

            // Validate the target URL
            if (!this.isValidTargetUrl(targetUrl)) {
                return c.text('Invalid target URL', 400);
            }

            // Use fetch directly to avoid potential CORS header conflicts
            const cleanHeaders: Record<string, string> = {
                'User-Agent': c.req.header('User-Agent') || 'Eidos-Proxy/1.0',
                'Accept': c.req.header('Accept') || '*/*',
                'X-Forwarded-For': '127.0.0.1',
            };

            // Add optional headers if they exist
            const acceptLanguage = c.req.header('Accept-Language');
            if (acceptLanguage) {
                cleanHeaders['Accept-Language'] = acceptLanguage;
            }

            const acceptEncoding = c.req.header('Accept-Encoding');
            if (acceptEncoding) {
                cleanHeaders['Accept-Encoding'] = acceptEncoding;
            }

            const host = c.req.header('host');
            if (host) {
                cleanHeaders['X-Forwarded-Host'] = host;
            }

            const requestInit: RequestInit = {
                method: c.req.method,
                headers: cleanHeaders,
                body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? await c.req.arrayBuffer() : undefined,
            };

            const response = await fetch(targetUrl, requestInit);

            // Create a new response with CORS headers
            const responseBody = await response.arrayBuffer();
            const newResponse = new Response(responseBody, {
                status: response.status,
                statusText: response.statusText,
                headers: new Headers(response.headers),
            });

            // Set CORS headers on the response
            newResponse.headers.set('Access-Control-Allow-Origin', '*');
            newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            newResponse.headers.set('Access-Control-Allow-Headers', '*');
            newResponse.headers.set('Access-Control-Allow-Credentials', 'false');

            return newResponse;

        } catch (error: any) {
            log(`Error handling proxy request: ${error.message}`);
            return c.text(`Proxy error: ${error.message}`, 500);
        }
    }

    /**
     * Handle CORS preflight requests
     */
    async handleOptionsRequest(_c: Ctx): Promise<Response> {
        const headers = new Headers();
        // Note: CORS headers may already be set by the main server middleware
        // Only set if not already present to avoid duplicates
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        headers.set('Access-Control-Allow-Headers', '*');
        headers.set('Access-Control-Max-Age', '86400'); // 24 hours

        return new Response(null, { status: 204, headers });
    }

    /**
     * Validate if the target URL is allowed to be proxied
     */
    private isValidTargetUrl(targetUrl: string): boolean {
        try {
            const url = new URL(targetUrl);
            
            // Only allow HTTP and HTTPS protocols
            if (!['http:', 'https:'].includes(url.protocol)) {
                return false;
            }

            // Block localhost and private IP ranges for security
            const hostname = url.hostname.toLowerCase();
            
            // Block localhost variations
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
                return false;
            }

            // Block private IP ranges (basic check)
            if (hostname.startsWith('192.168.') || 
                hostname.startsWith('10.') || 
                hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
                return false;
            }

            // Block internal domains
            if (hostname.endsWith('.localhost') || 
                hostname.endsWith('.local') ||
                hostname.includes('eidos.localhost')) {
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get proxy status and health information
     */
    async getProxyStatus(c: Ctx): Promise<Response> {
        const status = {
            service: 'Eidos Proxy Handler',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            features: [
                'CORS support',
                'URL validation',
                'Security filtering',
                'Request forwarding'
            ]
        };

        return c.json(status);
    }
}
