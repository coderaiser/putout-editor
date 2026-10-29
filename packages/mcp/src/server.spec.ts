import {test} from 'supertape';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {createServer} from './server.ts';
import {handler as docs} from './docs.ts';

type ToolHolder = {
    _registeredTools: Record<string, unknown>;
    _registeredPrompts: Record<string, unknown>;
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
        'flatlint_rule',
        'formats',
        'get_example',
        'learn_example',
        'learn_node',
        'learn_tree',
        'name_pattern',
        'parse',
        'printer_visitor',
        'test_pattern',
        'transform',
        'type_check',
        'validate',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('server: the docs overview names every tool', (t) => {
    const overview = docs().content[0].text;
    const isMissing = (name: string) => !overview.includes(name);
    const result = toolNames().filter(isMissing);
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('server: registers the new_rule prompt', (t) => {
    const server = createServer() as unknown as ToolHolder;
    const result = Object.keys(server._registeredPrompts);
    const expected = ['new_rule'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('server: the docs overview names every prompt', (t) => {
    const server = createServer() as unknown as ToolHolder;
    const overview = docs().content[0].text;
    const isMissing = (name: string) => !overview.includes(name);
    const result = Object.keys(server._registeredPrompts).filter(isMissing);
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});
