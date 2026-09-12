import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import * as docs from './local/docs.ts';
import * as parse from './local/parser.ts';
import * as findPlaces from './local/finder.ts';
import * as transform from './local/transformer.ts';

// The SDK's registerTool overloads hit TS2589 (type instantiation too deep)
// when Zod schemas contain .optional() or chained descriptors.
// We keep type safety inside each tool module and use `never` only at the
// boundary where TypeScript cannot resolve the overload chain.
type ToolDef = {
    name: string;
    description: string;
    schema: never;
    handler: never;
};

export function createServer(): McpServer {
    const server = new McpServer({
        name: 'putout-editor',
        version: '1.0.0',
    });

    for (const {name, description, schema, handler} of [docs, parse, findPlaces, transform] as unknown as ToolDef[])
        server.registerTool(name, {description, inputSchema: schema}, handler);

    return server;
}
