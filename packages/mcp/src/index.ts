import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {createServer} from './server.ts';
import * as api from './local/index.ts';

const server = createServer();

server.registerTool(api.docs.name, {
    description: api.docs.description,
    inputSchema: api.docs.schema,
}, api.docs.handler);

// @ts-expect-error — TS2589: type instantiation is excessively deep
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
