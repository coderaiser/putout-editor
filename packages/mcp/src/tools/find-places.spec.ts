import {test, stub} from 'supertape';
import {handler, name, description, schema} from './find-places.ts';

test('find-places tool: name is \'find_places\'', (t) => {
    t.equal(name, 'find_places');
    t.end();
});

test('find-places tool: description is a string', (t) => {
    t.equal(typeof description, 'string');
    t.end();
});

test('find-places tool: schema has fixture field', (t) => {
    t.ok('fixture' in schema);
    t.end();
});

test('find-places tool: schema has plugin field', (t) => {
    t.ok('plugin' in schema);
    t.end();
});

test('find-places tool: calls /api/v1/find-places', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves([]),
    });
    globalThis.fetch = fetchStub;

    await handler({fixture: 'var x = 1;', plugin: '...'});

    const url = fetchStub.args[0][0] as string;
    t.equal(url, 'http://localhost:8080/api/v1/find-places');
    t.end();
});

test('find-places tool: sends fixture in body', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves([]),
    });
    globalThis.fetch = fetchStub;

    await handler({fixture: 'var x = 1;', plugin: '...'});

    const body = JSON.parse((fetchStub.args[0][1] as RequestInit).body as string);
    t.equal(body.fixture, 'var x = 1;');
    t.end();
});

test('find-places tool: sends plugin in body', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves([]),
    });
    globalThis.fetch = fetchStub;

    await handler({fixture: 'var x = 1;', plugin: '...'});
    
    const body = JSON.parse((fetchStub.args[0][1] as RequestInit).body as string);
    t.equal(body.plugin, '...');
    t.end();
});

test('find-places tool: sends PUT request', async (t) => {
    const fetchStub = stub().resolves({
        ok: true,
        json: stub().resolves([]),
    });
    globalThis.fetch = fetchStub;

    await handler({fixture: 'var x = 1;', plugin: '...'});

    const method = (fetchStub.args[0][1] as RequestInit).method;
    t.equal(method, 'PUT');
    t.end();
});

test('find-places tool: uses default responseType json', async (t) => {
    const jsonStub = stub().resolves([]);
    globalThis.fetch = stub().resolves({
        ok: true,
        json: jsonStub,
    });

    await handler({fixture: 'var x = 1;', plugin: '...'});

    t.equal(jsonStub.callCount, 1);
    t.end();
});

test('find-places tool: returns stringified places array on success', async (t) => {
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves([{rule: 'test', message: 'test'}]),
    });

    const result = await handler({fixture: 'var x = 1;', plugin: '...'});

    t.ok(result.content[0].text.includes('rule'));
    t.end();
});

test('find-places tool: returns error text on plugin_syntax error', async (t) => {
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

test('find-places tool: returns error text on plugin_error', async (t) => {
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

test('find-places tool: returns error text on network failure', async (t) => {
    globalThis.fetch = stub().rejects(new Error('ECONNREFUSED'));

    const result = await handler({fixture: 'x', plugin: '...'});

    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});
