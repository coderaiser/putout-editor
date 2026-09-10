import process from 'node:process';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {createServer} from './server.ts';

const USE_HTTP = process.env.USE_HTTP === 'true';

const api = USE_HTTP ? await import('./remote/index.ts') : await import('./local/index.ts');

const server = createServer();

server.registerTool(api.docs.name, {
    description: api.docs.description,
    inputSchema: api.docs.schema,
}, api.docs.handler);

server.registerTool(api.parse.name, {
    description: api.parse.description,
    inputSchema: api.parse.schema,
}, api.parse.handler);

server.registerTool(api.findPlaces.name, {
    description: api.findPlaces.description,
    inputSchema: api.findPlaces.schema,
}, api.findPlaces.handler);

server.registerTool(api.transform.name, {
    description: api.transform.description,
    inputSchema: api.transform.schema,
}, api.transform.handler);

const transport = new StdioServerTransport();
await server.connect(transport);
