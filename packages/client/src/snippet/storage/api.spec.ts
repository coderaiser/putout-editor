import {
    test,
    stub,
    type Stub,
} from 'supertape';
import api from './api.ts';

/**
 * This spec is *about* `api()` itself, so it deliberately keeps a thin double
 * around `fetch` instead of going through the MSW harness: the subject under
 * test is the URL/options it builds, not the HTTP round trip.
 *
 * The double is always restored in `finally` — supertape runs every spec file
 * in one process, so a leaked `globalThis.fetch` breaks every later spec.
 */
const withFetchStub = async <T>(run: (fetch: Stub<unknown[], Promise<Response>>) => Promise<T>): Promise<T> => {
    const originalFetch = globalThis.fetch;
    const fetchStub = stub().resolves(new Response('{}'));
    
    globalThis.fetch = fetchStub as typeof globalThis.fetch;
    
    try {
        return await run(fetchStub);
    } finally {
        globalThis.fetch = originalFetch;
    }
};

test('api: calls fetch with correct path and default options', async (t) => {
    const url = await withFetchStub(async (fetchStub) => {
        await api('/gist');
        return fetchStub.args[0][0] as string;
    });
    
    const result = url.endsWith('/api/v1/gist');
    
    t.ok(result);
    t.end();
});

test('api: calls fetch with custom options', async (t) => {
    const options = await withFetchStub(async (fetchStub) => {
        await api('/gist', {
            method: 'POST',
        });
        
        return fetchStub.args[0][1] as {
            method: string;
        };
    });
    
    t.equal(options.method, 'POST');
    t.end();
});

test('api: passes options through untouched', async (t) => {
    const sentOptions = {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const receivedOptions = await withFetchStub(async (fetchStub) => {
        await api('/x', sentOptions);
        return fetchStub.args[0][1] as typeof sentOptions;
    });
    
    t.deepEqual(receivedOptions, sentOptions);
    t.end();
});

test('api: keeps the whole path after the version prefix', async (t) => {
    const url = await withFetchStub(async (fetchStub) => {
        await api('/gist/abc123/sha1');
        return fetchStub.args[0][0] as string;
    });
    
    const result = url.endsWith('/api/v1/gist/abc123/sha1');
    
    t.ok(result);
    t.end();
});

test('api: resolves the fetch call (no throw)', async (t) => {
    const result = await withFetchStub(async () => {
        return await api('/gist');
    });
    
    t.ok(result instanceof Response);
    t.end();
});
