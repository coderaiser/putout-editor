import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import * as docs from './docs.ts';
import * as parse from './parser.ts';
import * as findPlaces from './finder.ts';
import * as transform from './transformer.ts';
import * as validate from './validator.ts';
import * as examples from './examples.ts';

type AnyRegister = (name: string, config: {
    description: string;
    inputSchema?: any;
}, handler: (...args: any[]) => any) => void;

export function createServer(): McpServer {
    const server = new McpServer({
        name: 'putout-editor',
        version: '1.0.0',
    });
    
    const register = server.registerTool.bind(server) as AnyRegister;
    
    register(docs.name, {description: docs.description, inputSchema: docs.schema}, docs.handler);
    register(parse.name, {description: parse.description, inputSchema: parse.schema}, parse.handler);
    register(findPlaces.name, {description: findPlaces.description, inputSchema: findPlaces.schema}, findPlaces.handler);
    register(transform.name, {description: transform.description, inputSchema: transform.schema}, transform.handler);
    register(validate.name, {description: validate.description, inputSchema: validate.schema}, validate.handler);
    register(examples.name, {description: examples.description, inputSchema: examples.schema}, examples.handler);
    
    return server;
}
