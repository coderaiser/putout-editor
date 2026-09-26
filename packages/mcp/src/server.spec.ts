import {test} from 'supertape';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {createServer} from './server.ts';

type ToolHolder = {
    _registeredTools: Record<string, unknown>;
};

const getTools = (server: McpServer) => (server as unknown as ToolHolder)._registeredTools;

const toolNames = () => Object
    .keys(getTools(createServer()))
    .sort();

test('server: createServer returns an object', (t) => {
    const server = createServer();
    
    t.ok(server);
    t.end();
});

test('server: createServer returns McpServer instance', (t) => {
    const server = createServer();
    const result = typeof server.registerTool;
    const expected = 'function';
    
    t.equal(result, expected);
    t.end();
});

test('server: registers the base tools', (t) => {
    const result = toolNames();
    const expected = [
        'docs',
        'fetch_snippet',
        'find_places',
        'formats',
        'get_example',
        'parse',
        'transform',
        'validate',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});
