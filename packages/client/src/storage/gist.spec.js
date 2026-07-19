import {test, stub} from 'supertape';
import {
    matchesURL,
    fetchFromURL,
    owns,
    create,
    update,
    fork,
} from './gist.js';

const isError = (a) => a instanceof Error;

test('gist: matchesURL: true for gist hash', (t) => {
    const orig = globalThis.location.hash;
    
    globalThis.location.hash = '#/gist/abc123';
    const result = matchesURL();
    
    globalThis.location.hash = orig;
    
    t.ok(result);
    t.end();
});

test('gist: matchesURL: false for snippet hash', (t) => {
    const orig = globalThis.location.hash;
    
    globalThis.location.hash = '#/abc123';
    const result = matchesURL();
    
    globalThis.location.hash = orig;
    
    t.notOk(result);
    t.end();
});

test('gist: matchesURL: false for empty hash', (t) => {
    const orig = globalThis.location.hash;
    
    globalThis.location.hash = '';
    const result = matchesURL();
    
    globalThis.location.hash = orig;
    
    t.notOk(result);
    t.end();
});

test('gist: owns: false for plain object', (t) => {
    const result = owns({});
    
    t.notOk(result);
    t.end();
});

test('gist: fetchFromURL: resolves null when hash does not match', async (t) => {
    const orig = globalThis.location.hash;
    
    globalThis.location.hash = '';
    const result = await fetchFromURL();
    
    globalThis.location.hash = orig;
    
    t.notOk(result);
    t.end();
});

test('gist: fetchFromURL: 404 throws with snippet id in message', async (t) => {
    const origHash = globalThis.location.hash;
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: false,
        status: 404,
    });
    globalThis.location.hash = '#/gist/missing123';
    
    const result = await fetchFromURL().catch((e) => e);
    
    globalThis.location.hash = origHash;
    globalThis.fetch = origFetch;
    
    t.match(result.message, 'missing123');
    t.end();
});

test('gist: fetchFromURL: non-404 error throws Unknown error', async (t) => {
    const origHash = globalThis.location.hash;
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: false,
        status: 500,
    });
    globalThis.location.hash = '#/gist/someid';
    
    const result = await fetchFromURL().catch((e) => e);
    
    globalThis.location.hash = origHash;
    globalThis.fetch = origFetch;
    
    t.match(result.message, 'Unknown error');
    t.end();
});

test('gist: create: ok response resolves Revision', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
            id: 'new-gist',
            history: [{
                version: 'sha1',
            }],
            files: {
                'astexplorer.json': {
                    content: JSON.stringify({
                        parserID: 'babel',
                        toolID: null,
                        settings: {
                            babel: {},
                        },
                        versions: {},
                    }),
                },
                'source.js': {
                    content: 'const a = 1;',
                },
            },
        }),
    });
    
    const result = await create({
        parserID: 'babel',
        filename: 'source.js',
        code: 'const a = 1;',
    });
    
    globalThis.fetch = origFetch;
    
    t.equal(result.getSnippetID(), 'new-gist');
    t.end();
});

test('gist: create: error response throws', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: false,
        status: 500,
    });
    
    const result = await create({}).catch((e) => e);
    
    globalThis.fetch = origFetch;
    
    t.match(result.message, 'Unable to create snippet');
    t.end();
});

test('gist: fork: error response throws', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: false,
        status: 500,
    });
    
    const fakeRevision = {
        getSnippetID: () => 'abc',
        getRevisionID: () => 'sha1',
    };
    
    const result = await fork(fakeRevision, {}).catch((e) => e);
    
    globalThis.fetch = origFetch;
    
    t.match(result.message, 'Unable to fork snippet');
    t.end();
});

test('gist: update: error response on fetch snippet throws', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: false,
        status: 500,
    });
    
    const fakeRevision = {
        getSnippetID: () => 'abc',
    };
    
    const result = await update(fakeRevision, {}).catch((e) => e);
    
    globalThis.fetch = origFetch;
    
    t.ok(isError(result));
    t.end();
});
