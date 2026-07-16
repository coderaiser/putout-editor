import {test, stub} from 'supertape';
import api from './api.js';

test('api: calls fetch with correct path and default options', async (t) => {
    const originalFetch = globalThis.fetch;
    const fetch = stub();
    
    globalThis.fetch = fetch;
    await api('/gist');
    globalThis.fetch = originalFetch;
    
    t.calledWith(fetch, ['/api/v1/gist', undefined]);
    t.end();
});

test('api: calls fetch with custom options', async (t) => {
    const originalFetch = globalThis.fetch;
    const fetch = stub();
    
    globalThis.fetch = fetch;
    await api('/gist', {method: 'POST'});
    globalThis.fetch = originalFetch;
    
    t.calledWith(fetch, ['/api/v1/gist', {method: 'POST'}]);
    t.end();
});
