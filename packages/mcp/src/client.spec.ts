import {test} from 'supertape';
import {Client} from '@modelcontextprotocol/sdk/client';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {createServer} from './server.ts';

/**
 * The server as a client sees it: the same `tools/list` and `prompts/get` that
 * Claude Code sends. The tool list goes into every session, so its size is a
 * budget.
 */
const connect = async () => {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    const client = new Client({
        name: 'spec',
        version: '1.0.0',
    });
    
    await createServer().connect(serverSide);
    await client.connect(clientSide);
    
    return client;
};

test('client: tools/list is at most 10000 bytes', async (t) => {
    const client = await connect();
    const {tools} = await client.listTools();
    const result = JSON.stringify(tools).length <= 10_000;
    
    await client.close();
    
    t.ok(result);
    t.end();
});

test('client: prompts/get new_rule carries the goal', async (t) => {
    const client = await connect();
    const {messages} = await client.getPrompt({
        name: 'new_rule',
        arguments: {
            goal: 'replace var with let',
        },
    });
    
    await client.close();
    
    const [message] = messages;
    const {text} = message.content as {
        text: string;
    };
    
    t.match(text, 'replace var with let');
    t.end();
});
