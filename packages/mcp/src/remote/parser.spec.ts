import {test, stub} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
} from './parser.ts';

type FetchStub = ReturnType<typeof stub>;

test('remote parse: name is \'parse\'', (t) => {
    t.equal(name, 'parse');
    t.end();
});

test('remote parse: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('remote parse: schema has source field', (t) => {
    t.ok('source' in schema);
    t.end();
});

test('remote parse: schema has optional query field', (t) => {
    t.ok('query' in schema);
    t.end();
});

test('remote parse: calls /api/v1/parse when query absent', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves({}),
    }) as unknown as typeof fetch;
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    
    await handler({
        source: 'const x = 1;',
    });
    
    const url = (fetchStub as unknown as FetchStub).args[0][0] as string;
    const result = url.includes('/api/v1/parse');
    
    t.ok(result);
    t.end();
});

test('remote parse: does not append query param when query absent', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves({}),
    }) as unknown as typeof fetch;
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    
    await handler({
        source: 'const x = 1;',
    });
    
    const url = (fetchStub as unknown as FetchStub).args[0][0] as string;
    const result = url.includes('query=');
    
    t.notOk(result);
    t.end();
});

test('remote parse: appends query param when query provided', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves([]),
    }) as unknown as typeof fetch;
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    
    await handler({
        source: 'x',
        query: 'VariableDeclaration,Identifier',
    });
    
    const url = (fetchStub as unknown as FetchStub).args[0][0] as string;
    const result = url.includes('?query=');
    
    t.ok(result);
    t.end();
});

test('remote parse: sends PUT request', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves({}),
    }) as unknown as typeof fetch;
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    
    await handler({
        source: 'const x = 1;',
    });
    
    const {method} = (fetchStub as unknown as FetchStub).args[0][1] as RequestInit;
    
    t.equal(method, 'PUT');
    t.end();
});

test('remote parse: returns error text on 4xx response', async (t) => {
    globalThis.fetch = stub().resolves({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: stub().resolves(JSON.stringify({
            kind: 'plugin_syntax',
            message: 'bad',
        })),
    }) as unknown as typeof fetch;
    
    const result = await handler({
        source: 'const x = 1;',
    });
    
    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});

test('remote parse: returns error text on network failure', async (t) => {
    globalThis.fetch = stub().rejects(Error('ECONNREFUSED')) as unknown as typeof fetch;
    
    const result = await handler({
        source: 'const x = 1;',
    });
    
    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});
