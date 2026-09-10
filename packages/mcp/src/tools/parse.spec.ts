import {test, stub} from 'supertape';
import {handler, name, description, schema} from './parse.ts';

test('parse tool: name is \'parse\'', (t) => {
    t.equal(name, 'parse');
    t.end();
});

test('parse tool: description is a string', (t) => {
    t.equal(typeof description, 'string');
    t.end();
});

test('parse tool: schema has source field', (t) => {
    t.ok('source' in schema);
    t.end();
});

test('parse tool: schema has optional query field', (t) => {
    t.ok('query' in schema);
    t.end();
});

test('parse tool: calls /api/v1/parse when query absent', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves({}),
    });
    globalThis.fetch = fetchStub;

    await handler({source: 'const x = 1;'});

    const url = fetchStub.args[0][0] as string;
    t.equal(url, 'http://localhost:8080/api/v1/parse');
    t.end();
});

test('parse tool: does not append query param when query absent', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves({}),
    });
    globalThis.fetch = fetchStub;

    await handler({source: 'const x = 1;'});

    const url = fetchStub.args[0][0] as string;
    t.notOk(url.includes('query='));
    t.end();
});

test('parse tool: appends query param when query provided', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves([]),
    });
    globalThis.fetch = fetchStub;

    await handler({source: 'x', query: 'VariableDeclaration,Identifier'});

    const url = fetchStub.args[0][0] as string;
    t.ok(url.includes('?query='));
    t.end();
});

test('parse tool: encodes query param value', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves([]),
    });
    globalThis.fetch = fetchStub;

    await handler({source: 'x', query: 'VariableDeclaration,Identifier'});

    const url = fetchStub.args[0][0] as string;
    t.ok(url.includes('VariableDeclaration%2CIdentifier'));
    t.end();
});

test('parse tool: sends source in request body', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves({}),
    });
    globalThis.fetch = fetchStub;

    await handler({source: 'const x = 1;'});

    const body = JSON.parse((fetchStub.args[0][1] as RequestInit).body as string);
    t.equal(body.source, 'const x = 1;');
    t.end();
});

test('parse tool: sends PUT request', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves({}),
    });
    globalThis.fetch = fetchStub;

    await handler({source: 'const x = 1;'});

    const method = (fetchStub.args[0][1] as RequestInit).method;
    t.equal(method, 'PUT');
    t.end();
});

test('parse tool: uses default responseType json', async (t) => {
    const jsonStub = stub().resolves({type: 'File'});
    globalThis.fetch = stub().resolves({
        ok: true,
        json: jsonStub,
    });

    await handler({source: 'const x = 1;'});

    // json() was called — confirms responseType:'json' default
    t.equal(jsonStub.callCount, 1);
    t.end();
});

test('parse tool: returns JSON stringified AST on success', async (t) => {
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({type: 'File'}),
    });

    const result = await handler({source: 'const x = 1;'});

    t.ok(result.content[0].text.includes('"type"'));
    t.end();
});

test('parse tool: returns error text on 4xx response', async (t) => {
    globalThis.fetch = stub().resolves({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: stub().resolves(JSON.stringify({kind: 'plugin_syntax', message: 'bad'})),
    });

    const result = await handler({source: 'const x = 1;'});

    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});

test('parse tool: returns error text on network failure', async (t) => {
    globalThis.fetch = stub().rejects(new Error('ECONNREFUSED'));

    const result = await handler({source: 'const x = 1;'});

    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});
