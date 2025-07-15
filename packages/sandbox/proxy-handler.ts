import { log } from 'electron-log';
import type { Context } from 'hono';
import type { BlankEnv } from 'hono/types';
import { proxy } from 'hono/proxy';

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

            // Use Hono's proxy helper to forward the request
            return await proxy(targetUrl, {
                headers: {
                    // Forward relevant headers from the original request
                    'User-Agent': c.req.header('User-Agent') || 'Eidos-Proxy/1.0',
                    'Accept': c.req.header('Accept') || '*/*',
                    'Accept-Language': c.req.header('Accept-Language'),
                    'Accept-Encoding': c.req.header('Accept-Encoding'),
                    // Add CORS headers for the response
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                    // Remove potentially sensitive headers
                    'Authorization': undefined,
                    'Cookie': undefined,
                    'X-Forwarded-For': '127.0.0.1',
                    'X-Forwarded-Host': c.req.header('host'),
                },
                // Forward the request method and body if applicable
                method: c.req.method,
                body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? await c.req.arrayBuffer() : undefined,
            });

        } catch (error: any) {
            log(`Error handling proxy request: ${error.message}`);
            return c.text(`Proxy error: ${error.message}`, 500);
        }
    }

    /**
     * Handle CORS preflight requests
     */
    async handleOptionsRequest(c: Ctx): Promise<Response> {
        const headers = new Headers();
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
