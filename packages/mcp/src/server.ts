import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';

export function createServer(): McpServer {
    const server = new McpServer({
        name: 'putout-editor',
        version: '1.0.0',
    });
    
    return server;
}
