import {test} from 'supertape';
import {createServer} from './server.ts';

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
