import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import * as docs from './tools/docs.ts';
import * as parse from './tools/parse.ts';
import * as findPlaces from './tools/find-places.ts';
import * as transform from './tools/transform.ts';

export function createServer(): McpServer {
    const server = new McpServer({
        name: 'putout-editor',
        version: '1.0.0',
    });
    
    server.tool(docs.name, docs.description, docs.schema, docs.handler);
    server.tool(parse.name, parse.description, parse.schema, parse.handler);
    server.tool(findPlaces.name, findPlaces.description, findPlaces.schema, findPlaces.handler);
    server.tool(transform.name, transform.description, transform.schema, transform.handler);
    
    return server;
}
