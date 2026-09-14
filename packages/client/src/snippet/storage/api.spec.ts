import {test, stub} from 'supertape';
import api from './api.ts';

test('api: calls fetch with correct path and default options', async (t) => {
    const originalFetch = globalThis.fetch;
    const fetch = stub();
    
    globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
    await api('/gist');
    globalThis.fetch = originalFetch;
    const result = fetch.args[0][0].endsWith('/api/v1/gist');
    
    t.ok(result);
    t.end();
});

test('api: calls fetch with custom options', async (t) => {
    const originalFetch = globalThis.fetch;
    const fetch = stub();
    
    globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
    await api('/gist', {
        method: 'POST',
    });
    globalThis.fetch = originalFetch;
    
    t.equal(fetch.args[0][1].method, 'POST');
    t.end();
});
