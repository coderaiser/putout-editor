import {test, stub} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
} from './transformer.ts';

type FetchStub = ReturnType<typeof stub>;

test('remote transform: name is \'transform\'', (t) => {
    t.equal(name, 'transform');
    t.end();
});

test('remote transform: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('remote transform: schema has fixture field', (t) => {
    t.ok('fixture' in schema);
    t.end();
});

test('remote transform: schema has plugin field', (t) => {
    t.ok('plugin' in schema);
    t.end();
});

test('remote transform: calls /api/v1/transform', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        text: stub().resolves('const x = 1;'),
    }) as unknown as typeof fetch;
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    
    await handler({
        fixture: 'var x = 1;',
        plugin: '...',
    });
    
    const url = (fetchStub as unknown as FetchStub).args[0][0] as string;
    const result = url.includes('/api/v1/transform');
    
    t.ok(result);
    t.end();
});

test('remote transform: sends fixture in body', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        text: stub().resolves('const x = 1;'),
    }) as unknown as typeof fetch;
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    
    await handler({
        fixture: 'var x = 1;',
        plugin: '...',
    });
    
    const body = JSON.parse(((fetchStub as unknown as FetchStub).args[0][1] as RequestInit).body as string);
    
    t.equal(body.fixture, 'var x = 1;');
    t.end();
});

test('remote transform: sends plugin in body', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        text: stub().resolves('const x = 1;'),
    }) as unknown as typeof fetch;
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    
    await handler({
        fixture: 'var x = 1;',
        plugin: '...',
    });
    
    const body = JSON.parse(((fetchStub as unknown as FetchStub).args[0][1] as RequestInit).body as string);
    
    t.equal(body.plugin, '...');
    t.end();
});

test('remote transform: sends PUT request', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        text: stub().resolves('const x = 1;'),
    }) as unknown as typeof fetch;
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    
    await handler({
        fixture: 'var x = 1;',
        plugin: '...',
    });
    
    const {method} = (fetchStub as unknown as FetchStub).args[0][1] as RequestInit;
    
    t.equal(method, 'PUT');
    t.end();
});

test('remote transform: uses responseType text', async (t) => {
    const textStub = stub().resolves('const x = 1;');
    
    globalThis.fetch = stub().resolves({
        ok: true,
        text: textStub,
    }) as unknown as typeof fetch;
    
    await handler({
        fixture: 'var x = 1;',
        plugin: '...',
    });
    
    t.calledOnce(textStub);
    t.end();
});

test('remote transform: returns transformed code as plain string', async (t) => {
    globalThis.fetch = stub().resolves({
        ok: true,
        text: stub().resolves('const x = 1;'),
    }) as unknown as typeof fetch;
    
    const result = await handler({
        fixture: 'var x = 1;',
        plugin: '...',
    });
    
    t.equal(result.content[0].text, 'const x = 1;');
    t.end();
});

test('remote transform: does not JSON.stringify the result', async (t) => {
    globalThis.fetch = stub().resolves({
        ok: true,
        text: stub().resolves('const x = 1;'),
    }) as unknown as typeof fetch;
    
    const result = await handler({
        fixture: 'var x = 1;',
        plugin: '...',
    });
    
    t.notOk(result.content[0].text.startsWith('"'));
    t.end();
});

test('remote transform: returns error text on plugin_syntax error', async (t) => {
    globalThis.fetch = stub().resolves({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: stub().resolves(JSON.stringify({
            kind: 'plugin_syntax',
            message: 'bad syntax',
        })),
    }) as unknown as typeof fetch;
    
    const result = await handler({
        fixture: 'x',
        plugin: 'broken',
    });
    
    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});

test('remote transform: returns error text on network failure', async (t) => {
    globalThis.fetch = stub().rejects(Error('ECONNREFUSED')) as unknown as typeof fetch;
    
    const result = await handler({
        fixture: 'x',
        plugin: '...',
    });
    
    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});
