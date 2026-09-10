import {test, stub} from 'supertape';
import {handler, name, description, schema} from './transform.ts';

test('transform tool: name is \'transform\'', (t) => {
    t.equal(name, 'transform');
    t.end();
});

test('transform tool: description is a string', (t) => {
    t.equal(typeof description, 'string');
    t.end();
});

test('transform tool: schema has fixture field', (t) => {
    t.ok('fixture' in schema);
    t.end();
});

test('transform tool: schema has plugin field', (t) => {
    t.ok('plugin' in schema);
    t.end();
});

test('transform tool: calls /api/v1/transform', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        text: stub().resolves('const x = 1;'),
    });
    globalThis.fetch = fetchStub;

    await handler({fixture: 'var x = 1;', plugin: '...'});

    const url = fetchStub.args[0][0] as string;
    t.equal(url, 'http://localhost:8080/api/v1/transform');
    t.end();
});

test('transform tool: sends fixture in body', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        text: stub().resolves('const x = 1;'),
    });
    globalThis.fetch = fetchStub;

    await handler({fixture: 'var x = 1;', plugin: '...'});

    const body = JSON.parse((fetchStub.args[0][1] as RequestInit).body as string);
    t.equal(body.fixture, 'var x = 1;');
    t.end();
});

test('transform tool: sends plugin in body', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        text: stub().resolves('const x = 1;'),
    });
    globalThis.fetch = fetchStub;

    await handler({fixture: 'var x = 1;', plugin: '...'});

    const body = JSON.parse((fetchStub.args[0][1] as RequestInit).body as string);
    t.equal(body.plugin, '...');
    t.end();
});

test('transform tool: sends PUT request', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        text: stub().resolves('const x = 1;'),
    });
    globalThis.fetch = fetchStub;

    await handler({fixture: 'var x = 1;', plugin: '...'});

    const method = (fetchStub.args[0][1] as RequestInit).method;
    t.equal(method, 'PUT');
    t.end();
});

test('transform tool: uses responseType text', async (t) => {
    const textStub = stub().resolves('const x = 1;');
    globalThis.fetch = stub().resolves({
        ok: true,
        text: textStub,
    });

    await handler({fixture: 'var x = 1;', plugin: '...'});

    t.equal(textStub.callCount, 1);
    t.end();
});

test('transform tool: returns transformed code as plain string', async (t) => {
    globalThis.fetch = stub().resolves({
        ok: true,
        text: stub().resolves('const x = 1;'),
    });

    const result = await handler({fixture: 'var x = 1;', plugin: '...'});

    t.equal(result.content[0].text, 'const x = 1;');
    t.end();
});

test('transform tool: does not JSON.stringify the result', async (t) => {
    globalThis.fetch = stub().resolves({
        ok: true,
        text: stub().resolves('const x = 1;'),
    });

    const result = await handler({fixture: 'var x = 1;', plugin: '...'});

    // If JSON.stringify were applied the result would be '"const x = 1;"'
    t.notOk(result.content[0].text.startsWith('"'));
    t.end();
});

test('transform tool: returns error text on plugin_syntax error', async (t) => {
    globalThis.fetch = stub().resolves({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: stub().resolves(JSON.stringify({kind: 'plugin_syntax', message: 'bad syntax'})),
    });

    const result = await handler({fixture: 'x', plugin: 'broken'});

    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});

test('transform tool: returns error text on plugin_error', async (t) => {
    globalThis.fetch = stub().resolves({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: stub().resolves(JSON.stringify({kind: 'plugin_error', message: 'plugin error'})),
    });

    const result = await handler({fixture: 'x', plugin: 'broken'});

    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});

test('transform tool: returns error text on network failure', async (t) => {
    globalThis.fetch = stub().rejects(new Error('ECONNREFUSED'));

    const result = await handler({fixture: 'x', plugin: '...'});

    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});
