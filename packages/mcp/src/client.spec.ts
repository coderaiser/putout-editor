import process from 'node:process';
import {test, stub} from 'supertape';
import {tryToCatch} from 'try-to-catch';
import {
    request,
    DEFAULT_BASE_URL,
    RequestError,
} from './client.ts';

type FetchStub = ReturnType<typeof stub>;

const okJson = (data: unknown) => stub().resolves({
    ok: true,
    json: stub().resolves(data),
    text: stub().resolves(''),
}) as unknown as typeof fetch;

const okText = (text: string) => stub().resolves({
    ok: true,
    text: stub().resolves(text),
    json: stub().resolves(null),
}) as unknown as typeof fetch;

const errResponse = (status: number, text: string) => stub().resolves({
    ok: false,
    status,
    statusText: 'Error',
    text: stub().resolves(text),
}) as unknown as typeof fetch;

test('client: uses DEFAULT_BASE_URL when BASE_URL env not set', async (t) => {
    delete process.env.BASE_URL;
    const fetchStub = okJson({});
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    
    await request('/api/v1/parse', {
        body: {
            source: 'x',
        },
    });
    const result = ((fetchStub as unknown as FetchStub).args[0][0] as string).startsWith(DEFAULT_BASE_URL);
    
    t.ok(result);
    t.end();
});

test('client: uses BASE_URL from env when set', async (t) => {
    process.env.BASE_URL = 'https://putout.cloudcmd.io';
    const fetchStub = okJson({});
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    
    await request('/api/v1/parse', {
        body: {
            source: 'x',
        },
    });
    const result = ((fetchStub as unknown as FetchStub).args[0][0] as string).startsWith('https://putout.cloudcmd.io');
    delete process.env.BASE_URL;
    
    t.ok(result);
    t.end();
});

test('client: sends GET when no body in options', async (t) => {
    const fetchStub = okText('# docs');
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    
    await request('/llms-full.txt', {
        responseType: 'text',
    });
    
    t.equal(((fetchStub as unknown as FetchStub).args[0][1] as RequestInit).method, 'GET');
    t.end();
});

test('client: sends PUT when body in options', async (t) => {
    const fetchStub = okJson({});
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    
    await request('/api/v1/parse', {
        body: {
            source: 'x',
        },
    });
    
    t.equal(((fetchStub as unknown as FetchStub).args[0][1] as RequestInit).method, 'PUT');
    t.end();
});

test('client: sets Content-Type application/json on PUT', async (t) => {
    const fetchStub = okJson({});
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    
    await request('/api/v1/parse', {
        body: {
            source: 'x',
        },
    });
    const headers = ((fetchStub as unknown as FetchStub).args[0][1] as RequestInit).headers as Record<string, string>;
    
    t.equal(headers['Content-Type'], 'application/json');
    t.end();
});

test('client: serialises body as JSON string', async (t) => {
    const fetchStub = okJson({});
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    
    await request('/api/v1/parse', {
        body: {
            source: 'x',
        },
    });
    
    t.equal(((fetchStub as unknown as FetchStub).args[0][1] as RequestInit).body, JSON.stringify({
        source: 'x',
    }));
    t.end();
});

test('client: returns parsed JSON when responseType is json (default)', async (t) => {
    globalThis.fetch = okJson({
        type: 'File',
    });
    
    const result = await request('/api/v1/parse', {
        body: {
            source: 'x',
        },
    });
    
    const expected = {
        type: 'File',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('client: returns text string when responseType is text', async (t) => {
    globalThis.fetch = okText('const x = 1;');
    
    const result = await request('/api/v1/transform', {
        body: {
            fixture: 'var x = 1;',
            plugin: '...',
        },
        responseType: 'text',
    });
    
    t.equal(result, 'const x = 1;');
    t.end();
});

test('client: throws RequestError on 4xx response', async (t) => {
    globalThis.fetch = errResponse(400, 'Bad Request');
    
    const [error] = await tryToCatch(request, '/api/v1/transform', {
        body: {},
    });
    
    t.ok(error instanceof RequestError);
    t.end();
});

test('client: throws RequestError on 5xx response', async (t) => {
    globalThis.fetch = errResponse(500, 'Internal Server Error');
    
    const [error] = await tryToCatch(request, '/api/v1/transform', {
        body: {},
    });
    
    t.ok(error instanceof RequestError);
    t.end();
});

test('client: RequestError status matches response status', async (t) => {
    globalThis.fetch = errResponse(400, 'Bad Request');
    
    const [error] = await tryToCatch(request, '/api/v1/transform', {
        body: {},
    });
    
    t.equal((error as RequestError).status, 400);
    t.end();
});

test('client: RequestError body is parsed JSON when error body is valid JSON', async (t) => {
    globalThis.fetch = errResponse(400, JSON.stringify({
        kind: 'plugin_syntax',
        message: 'bad',
    }));
    
    const [error] = await tryToCatch(request, '/api/v1/transform', {
        body: {},
    });
    
    t.deepEqual((error as RequestError).body, {
        kind: 'plugin_syntax',
        message: 'bad',
    });
    t.end();
});

test('client: RequestError body is raw text when error body is not JSON', async (t) => {
    globalThis.fetch = errResponse(500, 'Internal Server Error');
    
    const [error] = await tryToCatch(request, '/api/v1/transform', {
        body: {},
    });
    
    t.equal((error as RequestError).body, 'Internal Server Error');
    t.end();
});

test('client: reads error body only once (text, then tryCatch JSON.parse)', async (t) => {
    const textStub = stub().resolves(JSON.stringify({
        kind: 'error',
    }));
    
    globalThis.fetch = stub().resolves({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: textStub,
    }) as unknown as typeof fetch;
    
    await tryToCatch(request, '/api/v1/transform', {
        body: {},
    });
    
    t.calledOnce(textStub);
    t.end();
});

test('client: throws RequestError with status 0 on network failure', async (t) => {
    globalThis.fetch = stub().rejects(Error('ECONNREFUSED')) as unknown as typeof fetch;
    
    const [error] = await tryToCatch(request, '/api/v1/transform', {
        body: {},
    });
    
    t.equal((error as RequestError).status, 0);
    t.end();
});

test('client: RequestError body is original Error on network failure', async (t) => {
    const networkError = Error('ECONNREFUSED');
    
    globalThis.fetch = stub().rejects(networkError) as unknown as typeof fetch;
    
    const [error] = await tryToCatch(request, '/api/v1/transform', {
        body: {},
    });
    
    t.equal((error as RequestError).body, networkError);
    t.end();
});
