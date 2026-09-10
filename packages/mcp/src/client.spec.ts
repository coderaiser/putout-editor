import {test, stub} from 'supertape';
import {tryToCatch} from 'try-to-catch';
import {request, DEFAULT_BASE_URL, RequestError} from './client.ts';

// Helper: 2xx JSON response
const okJson = (data: unknown) => stub().resolves({
    ok: true,
    json: stub().resolves(data),
    text: stub().resolves(''),
});

// Helper: 2xx text response
const okText = (text: string) => stub().resolves({
    ok: true,
    text: stub().resolves(text),
    json: stub().resolves(null),
});

// Helper: error response with text body
const errResponse = (status: number, text: string) => stub().resolves({
    ok: false,
    status,
    statusText: 'Error',
    text: stub().resolves(text),
});

test('client: uses DEFAULT_BASE_URL when BASE_URL env not set', async (t) => {
    delete process.env.BASE_URL;
    const fetchStub = okJson({});
    globalThis.fetch = fetchStub;

    await request('/api/v1/parse', {body: {source: 'x'}});

    t.ok((fetchStub.args[0][0] as string).startsWith(DEFAULT_BASE_URL));
    t.end();
});

test('client: uses BASE_URL from env when set', async (t) => {
    process.env.BASE_URL = 'https://putout.cloudcmd.io';
    const fetchStub = okJson({});
    globalThis.fetch = fetchStub;

    await request('/api/v1/parse', {body: {source: 'x'}});

    t.ok((fetchStub.args[0][0] as string).startsWith('https://putout.cloudcmd.io'));
    delete process.env.BASE_URL;
    t.end();
});

test('client: sends GET when no body in options', async (t) => {
    globalThis.fetch = okText('# docs');

    await request('/llms-full.txt', {responseType: 'text'});

    t.equal((globalThis.fetch as ReturnType<typeof stub>).args[0][1].method, 'GET');
    t.end();
});

test('client: sends PUT when body in options', async (t) => {
    const fetchStub = okJson({});
    globalThis.fetch = fetchStub;

    await request('/api/v1/parse', {body: {source: 'x'}});

    t.equal((fetchStub.args[0][1] as RequestInit).method, 'PUT');
    t.end();
});

test('client: sets Content-Type application/json on PUT', async (t) => {
    const fetchStub = okJson({});
    globalThis.fetch = fetchStub;

    await request('/api/v1/parse', {body: {source: 'x'}});

    t.equal((fetchStub.args[0][1] as RequestInit).headers['Content-Type'], 'application/json');
    t.end();
});

test('client: serialises body as JSON string', async (t) => {
    const fetchStub = okJson({});
    globalThis.fetch = fetchStub;

    await request('/api/v1/parse', {body: {source: 'x'}});

    t.equal((fetchStub.args[0][1] as RequestInit).body, JSON.stringify({source: 'x'}));
    t.end();
});

test('client: returns parsed JSON when responseType is json (default)', async (t) => {
    globalThis.fetch = okJson({type: 'File'});

    const result = await request('/api/v1/parse', {body: {source: 'x'}});

    t.deepEqual(result, {type: 'File'});
    t.end();
});

test('client: returns text string when responseType is text', async (t) => {
    globalThis.fetch = okText('const x = 1;');

    const result = await request('/api/v1/transform', {
        body: {fixture: 'var x = 1;', plugin: '...'},
        responseType: 'text',
    });

    t.equal(result, 'const x = 1;');
    t.end();
});

test('client: throws RequestError on 4xx response', async (t) => {
    globalThis.fetch = errResponse(400, 'Bad Request');

    const [error] = await tryToCatch(request, '/api/v1/transform', {body: {}});

    t.ok(error instanceof RequestError);
    t.end();
});

test('client: throws RequestError on 5xx response', async (t) => {
    globalThis.fetch = errResponse(500, 'Internal Server Error');

    const [error] = await tryToCatch(request, '/api/v1/transform', {body: {}});

    t.ok(error instanceof RequestError);
    t.end();
});

test('client: RequestError status matches response status', async (t) => {
    globalThis.fetch = errResponse(400, 'Bad Request');

    const [error] = await tryToCatch(request, '/api/v1/transform', {body: {}});

    t.equal((error as RequestError).status, 400);
    t.end();
});

test('client: RequestError body is parsed JSON when error body is valid JSON', async (t) => {
    globalThis.fetch = errResponse(400, JSON.stringify({kind: 'plugin_syntax', message: 'bad'}));

    const [error] = await tryToCatch(request, '/api/v1/transform', {body: {}});

    t.deepEqual((error as RequestError).body, {kind: 'plugin_syntax', message: 'bad'});
    t.end();
});

test('client: RequestError body is raw text when error body is not JSON', async (t) => {
    globalThis.fetch = errResponse(500, 'Internal Server Error');

    const [error] = await tryToCatch(request, '/api/v1/transform', {body: {}});

    t.equal((error as RequestError).body, 'Internal Server Error');
    t.end();
});

test('client: reads error body only once (text, then tryCatch JSON.parse)', async (t) => {
    const textStub = stub().resolves(JSON.stringify({kind: 'error'}));
    globalThis.fetch = stub().resolves({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: textStub,
    });

    await tryToCatch(request, '/api/v1/transform', {body: {}});

    // text() called exactly once — no second read attempt
    t.equal(textStub.callCount, 1);
    t.end();
});

test('client: throws RequestError with status 0 on network failure', async (t) => {
    globalThis.fetch = stub().rejects(new Error('ECONNREFUSED'));

    const [error] = await tryToCatch(request, '/api/v1/transform', {body: {}});

    t.equal((error as RequestError).status, 0);
    t.end();
});

test('client: RequestError body is original Error on network failure', async (t) => {
    const networkError = new Error('ECONNREFUSED');
    globalThis.fetch = stub().rejects(networkError);

    const [error] = await tryToCatch(request, '/api/v1/transform', {body: {}});

    t.equal((error as RequestError).body, networkError);
    t.end();
});
