import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import * as docs from './local/docs.ts';
import * as parse from './local/parser.ts';
import * as findPlaces from './local/finder.ts';
import * as transform from './local/transformer.ts';

type ToolDef = {
    name: string;
    description: string;
    schema: typeof docs.schema | typeof parse.schema | typeof findPlaces.schema | typeof transform.schema;
    handler: typeof docs.handler | typeof parse.handler | typeof findPlaces.handler | typeof transform.handler;
};

export function createServer(): McpServer {
    const server = new McpServer({
        name: 'putout-editor',
        version: '1.0.0',
    });

    const tools: ToolDef[] = [docs, parse, findPlaces, transform].map((tool) => ({
        name: tool.name,
        description: tool.description,
        schema: tool.schema as ToolDef['schema'],
        handler: tool.handler as ToolDef['handler'],
    }));
    for (const {name, description, schema, handler} of tools)
        server.registerTool(name, {description, inputSchema: schema}, handler);

    return server;
}
