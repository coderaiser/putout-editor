// Setup file to patch fetch for MSW in happy-dom environment
// This must be loaded before any tests

import {handlers as defaultHandlers} from './msw/handlers/index.ts';

// Clone default handlers
const handlers = [...defaultHandlers];

// Store original happy-dom fetch
const originalFetch = globalThis.fetch;

// Create MSW-compatible fetch mock
export async function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || 'GET';
    
    // Parse the URL
    const parsedUrl = new URL(url, 'http://localhost');
    const pathname = parsedUrl.pathname;
    
    // Find matching handler using MSW's matching
    for (const handler of handlers) {
        // Use MSW's built-in matching
        const match = (handler as any).match?.({url: pathname, method});
        
        if (match) {
            const request = new Request(url, init);
            try {
                const response = await (handler as any).run({request, params: match.params});
                if (response) {
                    return response;
                }
            } catch (e) {
                // Handler didn't match, continue
            }
        }
    }
    
    // No handler found, call original fetch
    return originalFetch(input, init);
}

// Replace global fetch with our mock
globalThis.fetch = mockFetch as typeof fetch;

// Export server interface
export const server = {
    listen() {
        // Already patched above
    },
    use(...additionalHandlers: any[]) {
        handlers.push(...additionalHandlers);
    },
    resetHandlers() {
        // Reset to original handlers
        handlers.length = 0;
        handlers.push(...defaultHandlers);
    },
    close() {
        globalThis.fetch = originalFetch;
    },
};
