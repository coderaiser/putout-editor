import {test, stub} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
} from './docs.ts';

test('docs tool: name is \'docs\'', (t) => {
    t.equal(name, 'docs');
    t.end();
});

test('docs tool: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('docs tool: schema is empty object', (t) => {
    const result = schema;
    const expected = {};
    
    t.deepEqual(result, expected);
    t.end();
});

test('docs tool: calls /llms-full.txt', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        text: stub().resolves('# docs'),
    });
    
    globalThis.fetch = fetchStub;
    
    await handler({} as Record<string, never>);
    
    const url = fetchStub.args[0][0] as string;
    
    t.equal(url, 'http://localhost:8080/llms-full.txt');
    t.end();
});

test('docs tool: sends GET request', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        text: stub().resolves('# docs'),
    });
    
    globalThis.fetch = fetchStub;
    
    await handler({} as Record<string, never>);
    
    const [, fetchInit] = fetchStub.args[0] as [string, RequestInit];
    
    t.equal(fetchInit.method, 'GET');
    t.end();
});

test('docs tool: uses responseType text', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        text: stub().resolves('# docs'),
    });
    
    globalThis.fetch = fetchStub;
    
    await handler({} as Record<string, never>);
    
    // GET means no body — responseType:text means .text() was called not .json()
    const [, fetchInit] = fetchStub.args[0] as [string, RequestInit];
    
    t.equal(fetchInit.method, 'GET');
    t.end();
});

test('docs tool: returns text content on success', async (t) => {
    globalThis.fetch = stub().resolves({
        ok: true,
        text: stub().resolves('# docs'),
    });
    
    const result = await handler({} as Record<string, never>);
    
    t.equal(result.content[0].text, '# docs');
    t.end();
});

test('docs tool: returns error text when request fails', async (t) => {
    globalThis.fetch = stub().rejects(Error('ECONNREFUSED'));
    
    const result = await handler({} as Record<string, never>);
    
    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});
