import {test} from 'supertape';
import {http, HttpResponse} from 'msw';
import {server} from '../../../test/msw/server.ts';
import {
    makeGistHandlers,
    gistErrorHandler,
    gistHandlers,
} from '../../../test/msw/handlers/gist.ts';
import {apiURL} from '../../../test/msw/env.ts';
import {makeGistResponse} from '../../../test/msw/fixtures/gist.ts';
import type {StorageRevision} from './index.ts';
import {
    matchesURL,
    fetchFromURL,
    owns,
    create,
    update,
    fork,
    Revision,
} from './gist.ts';

const mockRevision: StorageRevision = {
    getPath() {
        return `/gist/${this.getSnippetID()}/${this.getRevisionID()}`;
    },
    getSnippetID: () => 'abc',
    getRevisionID: () => 'sha1',
};

const withHash = async <T>(hash: string, run: () => Promise<T>): Promise<T> => {
    const orig = globalThis.location.hash;
    
    globalThis.location.hash = hash;
    
    try {
        return await run();
    } finally {
        globalThis.location.hash = orig;
    }
};

const listen = () => server.listen({
    onUnhandledRequest: 'error',
});

test('gist: matchesURL: true for gist hash', (t) => {
    const orig = globalThis.location.hash;
    
    globalThis.location.hash = '#/gist/abc123';
    const result = matchesURL();
    
    globalThis.location.hash = orig;
    
    t.ok(result);
    t.end();
});

test('gist: matchesURL: true for gist hash without revision', (t) => {
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
    const result = await withHash('', async () => await fetchFromURL());
    
    t.notOk(result);
    t.end();
});

test('gist: fetchFromURL: 404 throws with snippet id in message', async (t) => {
    listen();
    server.use(...gistErrorHandler(404));
    
    const error = await withHash('#/gist/missing123', async () => {
        return await fetchFromURL().catch((e) => e);
    });
    
    server.close();
    
    t.match(error.message, 'missing123');
    t.end();
});

test('gist: fetchFromURL: 404 message contains the revision', async (t) => {
    listen();
    server.use(...gistErrorHandler(404));
    
    const error = await withHash('#/gist/missing123/rev456', async () => {
        return await fetchFromURL().catch((e) => e);
    });
    
    server.close();
    
    t.match(error.message, 'missing123/rev456');
    t.end();
});

test('gist: fetchFromURL: requests the hash-derived path', async (t) => {
    listen();
    
    let url = '';
    
    server.use(http.get(apiURL('/gist/:id/:revision'), ({request}) => {
        ({url} = request);
        return HttpResponse.json(makeGistResponse());
    }));
    
    await withHash('#/gist/abc123/rev456', async () => await fetchFromURL());
    
    server.close();
    const result = url.endsWith('/api/v1/gist/abc123/rev456');
    
    t.ok(result);
    t.end();
});

test('gist: fetchFromURL: requests latest when hash has no revision', async (t) => {
    listen();
    
    let url = '';
    
    server.use(http.get(apiURL('/gist/:id/:revision'), ({request}) => {
        ({url} = request);
        return HttpResponse.json(makeGistResponse());
    }));
    
    await withHash('#/gist/abc123', async () => await fetchFromURL());
    
    server.close();
    const result = url.endsWith('/api/v1/gist/abc123/latest');
    
    t.ok(result);
    t.end();
});

test('gist: fetchFromURL: non-404 error throws Unknown error', async (t) => {
    listen();
    server.use(...gistErrorHandler(500));
    
    const error = await withHash('#/gist/someid', async () => {
        return await fetchFromURL().catch((e) => e);
    });
    
    server.close();
    
    t.match(error.message, 'Unknown error');
    t.end();
});

test('gist: fetchFromURL: ok response resolves Revision', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist123',
        version: 'sha1ver',
    }));
    
    const result = await withHash('#/gist/gist123', async () => await fetchFromURL());
    
    server.close();
    
    t.equal(result!.getSnippetID(), 'gist123');
    t.end();
});

test('gist: fetchFromURL: requests the latest revision by default', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-default',
    }));
    
    const result = await withHash('#/gist/gist-default', async () => await fetchFromURL());
    
    server.close();
    
    t.equal(result!.getSnippetID(), 'gist-default');
    t.end();
});

test('gist: create: ok response resolves Revision', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'new-gist',
        version: 'sha1',
    }));
    
    const result = await create({
        parserID: 'babel',
        filename: 'source.js',
        code: 'const a = 1;',
    });
    
    server.close();
    
    t.equal(result.getSnippetID(), 'new-gist');
    t.end();
});

test('gist: create: error response throws', async (t) => {
    listen();
    server.use(http.post(apiURL('/gist'), () => new HttpResponse(null, {
        status: 500,
    })));
    
    const error = await create({}).catch((e) => e);
    
    server.close();
    
    t.match(error.message, 'Unable to create snippet');
    t.end();
});

test('gist: fork: error response throws', async (t) => {
    listen();
    server.use(http.post(apiURL('/gist/:id/:revision'), () => new HttpResponse(null, {
        status: 500,
    })));
    
    const error = await fork(mockRevision, {}).catch((e) => e);
    
    server.close();
    
    t.match(error.message, 'Unable to fork snippet');
    t.end();
});

test('gist: update: sends exactly one request', async (t) => {
    listen();
    
    let count = 0;
    
    server.use(http.patch(apiURL('/gist/:id'), () => {
        ++count;
        return HttpResponse.json(makeGistResponse());
    }));
    
    await update(mockRevision, {
        parserID: 'babel',
        code: 'x',
    });
    
    server.close();
    
    t.equal(count, 1);
    t.end();
});

test('gist: update: sends PATCH method', async (t) => {
    listen();
    
    let method = '';
    
    server.use(http.patch(apiURL('/gist/:id'), ({request}) => {
        ({method} = request);
        return HttpResponse.json(makeGistResponse());
    }));
    
    await update(mockRevision, {
        parserID: 'babel',
        code: 'x',
    });
    
    server.close();
    
    t.equal(method, 'PATCH');
    t.end();
});

test('gist: fork: sends POST to the revision path', async (t) => {
    listen();
    
    let request = '';
    
    server.use(http.post(apiURL('/gist/:id/:revision'), ({request: req}) => {
        request = `${req.method} ${req.url}`;
        return HttpResponse.json(makeGistResponse());
    }));
    
    await fork(mockRevision, {});
    
    server.close();
    const result = request.endsWith(`POST ${apiURL('/gist/abc/sha1')}`);
    
    t.ok(result);
    t.end();
});

test('gist: create: sends POST to /gist', async (t) => {
    listen();
    
    let request = '';
    
    server.use(http.post(apiURL('/gist'), ({request: req}) => {
        request = `${req.method} ${req.url}`;
        return HttpResponse.json(makeGistResponse());
    }));
    
    await create({});
    
    server.close();
    const result = request.endsWith(`POST ${apiURL('/gist')}`);
    
    t.ok(result);
    t.end();
});

test('gist: fork: ok response resolves Revision', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist123',
        version: 'sha1ver',
    }));
    
    const result = await fork(mockRevision, {});
    
    server.close();
    
    t.equal(result.getSnippetID(), 'gist123');
    t.end();
});

test('gist: update: returns Revision instance', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist123',
        version: 'sha1ver',
    }));
    
    const result = await update(mockRevision, {
        parserID: 'babel',
        code: 'x',
    });
    
    server.close();
    
    t.ok(result instanceof Revision);
    t.end();
});

test('gist: update: throws on non-ok response', async (t) => {
    listen();
    server.use(http.patch(apiURL('/gist/:id'), () => new HttpResponse(null, {
        status: 500,
    })));
    
    const error = await update(mockRevision, {
        code: 'x',
    }).catch((e) => e);
    
    server.close();
    
    t.ok(error);
    t.end();
});

test('gist: owns: returns true for Revision instance', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'owns-test',
        version: 'v1',
    }));
    
    const rev = await create({});
    
    server.close();
    const result = owns(rev);
    
    t.ok(result);
    t.end();
});

test('gist: Revision: constructor throws when config is missing', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        noConfig: true,
    }));
    
    const error = await create({}).catch((e) => e);
    
    server.close();
    
    t.match(error.message, 'content');
    t.end();
});

test('gist: v1 source format: getCode returns correct content', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-v1',
        version: 'v1',
        v: 1,
        code: 'legacy code',
    }));
    
    const rev = await create({});
    
    server.close();
    
    const result = rev.getCode();
    const expected = 'legacy code';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: canSave returns true', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-can-save',
        version: 'v1',
    }));
    
    const rev = await create({});
    
    server.close();
    
    t.ok(rev.canSave());
    t.end();
});

test('gist: Revision: getPath returns correct path', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-path',
        version: 'sha1ver',
    }));
    
    const rev = await create({});
    
    server.close();
    
    const result = rev.getPath();
    const expected = '/gist/gist-path/sha1ver';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getSnippetID returns correct id', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-sid',
        version: 'v1',
    }));
    
    const rev = await create({});
    
    server.close();
    
    const result = rev.getSnippetID();
    const expected = 'gist-sid';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getRevisionID returns correct version', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-revid',
        version: 'v42',
    }));
    
    const rev = await create({});
    
    server.close();
    
    const result = rev.getRevisionID();
    const expected = 'v42';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getTransformerID returns toolID when set', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-tool',
        toolID: 'putout',
    }));
    
    const rev = await create({});
    
    server.close();
    
    const result = rev.getTransformerID();
    const expected = 'putout';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getTransformerID returns null when not set', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-notool',
        toolID: null,
    }));
    
    const rev = await create({});
    
    server.close();
    
    t.notOk(rev.getTransformerID());
    t.end();
});

test('gist: Revision: getTransformCode returns content when transform file exists', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-tc',
        toolID: 'putout',
        transformCode: 'module.exports = function() {}',
    }));
    
    const rev = await create({});
    
    server.close();
    
    const result = rev.getTransformCode();
    const expected = 'module.exports = function() {}';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getTransformCode returns empty string when no transform file', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-notransform',
    }));
    
    const rev = await create({});
    
    server.close();
    
    const result = rev.getTransformCode();
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getParserID returns correct parserID', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-parserid',
        parserID: 'espree',
        settings: {
            espree: {},
        },
    }));
    
    const rev = await create({});
    
    server.close();
    
    const result = rev.getParserID();
    const expected = 'espree';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getParserSettings returns correct settings', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-parser-settings',
        settings: {
            babel: {
                sourceType: 'module',
            },
        },
    }));
    
    const rev = await create({});
    
    server.close();
    
    t.equal((rev.getParserSettings() as Record<string, unknown>).sourceType, 'module');
    t.end();
});

test('gist: Revision: getParserSettings returns undefined for missing key', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-no-settings',
        settings: {},
    }));
    
    const rev = await create({});
    
    server.close();
    
    t.notOk(rev.getParserSettings());
    t.end();
});

test('gist: Revision: getCode returns content for v2 source format', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-v2',
        v: 2,
        sourceCode: 'const b = 2;',
    }));
    
    const rev = await create({});
    
    server.close();
    
    const result = rev.getCode();
    const expected = 'const b = 2;';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getCode returns empty string for unknown config version', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-unknown-v',
        v: 3,
    }));
    
    const rev = await create({});
    
    server.close();
    
    const result = rev.getCode();
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getCode caches result', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-cache',
        sourceCode: 'const cached = true;',
    }));
    
    const rev = await create({});
    
    server.close();
    
    rev.getCode();
    const second = rev.getCode();
    
    t.equal(second, 'const cached = true;');
    t.end();
});

test('gist: Revision: getCode returns empty string when source file is missing', async (t) => {
    listen();
    server.use(http.post(apiURL('/gist'), () => HttpResponse.json({
        id: 'gist-nosource',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 3,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'other.js': {
                content: 'nope',
            },
        },
    })));
    
    const rev = await create({});
    
    server.close();
    
    const result = rev.getCode();
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getShareData returns object', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-share',
        version: 'v1',
    }));
    
    const rev = await create({});
    
    server.close();
    
    t.ok(rev.getShareData());
    t.end();
});

test('gist: Revision: getShareData versionedURL contains snippetID', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-share',
        version: 'v1',
    }));
    
    const rev = await create({});
    
    server.close();
    
    const result = rev
        .getShareData()
        .versionedURL
        .includes('gist-share');
    
    t.ok(result);
    t.end();
});

test('gist: Revision: getShareData versionedURL contains revisionID', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-share',
        version: 'v1',
    }));
    
    const rev = await create({});
    
    server.close();
    
    const result = rev
        .getShareData()
        .versionedURL
        .includes(rev.getRevisionID());
    
    t.ok(result);
    t.end();
});

test('gist: Revision: getShareData latestURL contains snippetID', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-share',
        version: 'v1',
    }));
    
    const rev = await create({});
    
    server.close();
    
    const result = rev
        .getShareData()
        .latestURL
        .includes('gist-share');
    
    t.ok(result);
    t.end();
});

test('gist: Revision: getShareData has no double slash in latestURL', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-share',
        version: 'v1',
    }));
    
    const rev = await create({});
    
    server.close();
    
    const result = rev
        .getShareData()
        .latestURL
        .replace('https://', '')
        .includes('//');
    
    t.notOk(result);
    t.end();
});

test('gist: Revision: getShareData embedURL is a string', async (t) => {
    listen();
    server.use(...makeGistHandlers({
        id: 'gist-share',
        version: 'v1',
    }));
    
    const rev = await create({});
    
    server.close();
    
    const result = typeof rev.getShareData().embedURL;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('gist: handlers: default gist handlers cover every backend call', async (t) => {
    listen();
    server.use(...gistHandlers);
    
    const result = [
        await create({}),
        await withHash('#/gist/gist-id/sha1', async () => await fetchFromURL()),
        await update(mockRevision, {}),
        await fork(mockRevision, {}),
    ].every(owns);
    
    server.close();
    
    t.ok(result);
    t.end();
});
