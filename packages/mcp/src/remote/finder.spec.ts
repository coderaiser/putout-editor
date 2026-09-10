import {test, stub} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
} from './finder.ts';

type FetchStub = ReturnType<typeof stub>;

test('remote find-places: name is \'find_places\'', (t) => {
    t.equal(name, 'find_places');
    t.end();
});

test('remote find-places: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('remote find-places: schema has fixture field', (t) => {
    t.ok('fixture' in schema);
    t.end();
});

test('remote find-places: schema has plugin field', (t) => {
    t.ok('plugin' in schema);
    t.end();
});

test('remote find-places: calls /api/v1/find-places', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves([]),
    }) as unknown as typeof fetch;
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    
    await handler({
        fixture: 'var x = 1;',
        plugin: '...',
    });
    
    const url = (fetchStub as unknown as FetchStub).args[0][0] as string;
    const result = url.includes('/api/v1/find-places');
    
    t.ok(result);
    t.end();
});

test('remote find-places: sends fixture in body', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves([]),
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

test('remote find-places: sends plugin in body', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves([]),
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

test('remote find-places: sends PUT request', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves([]),
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

test('remote find-places: returns error text on plugin_syntax error', async (t) => {
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

test('remote find-places: returns error text on network failure', async (t) => {
    globalThis.fetch = stub().rejects(Error('ECONNREFUSED')) as unknown as typeof fetch;
    
    const result = await handler({
        fixture: 'x',
        plugin: '...',
    });
    
    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});
