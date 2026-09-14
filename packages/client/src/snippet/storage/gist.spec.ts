import {test} from 'supertape';
import {http, HttpResponse} from 'msw';
import {
    matchesURL,
    fetchFromURL,
    owns,
    create,
    update,
    fork,
    Revision,
} from './gist.ts';
import {server} from '../../../test/msw/server.ts';
import {makeGistResponse} from '../../../test/msw/fixtures/gist.ts';

const noop = () => {};

server.listen({
    onUnhandledRequest: 'bypass',
});

const mockRevision = {
    getSnippetID: () => 'abc',
    getRevisionID: () => 'sha1',
};

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

test('gist: fetchFromURL: passes specific revision to fetch', async (t) => {
    const origHash = globalThis.location.hash;
    
    let capturedURL = '';
    
    server.use(http.get('*/api/v1/gist/:id/:revision', ({request}) => {
        capturedURL = request.url;
        return new HttpResponse(null, {
            status: 404,
        });
    }));
    
    globalThis.location.hash = '#/gist/abc123/rev456';
    
    await fetchFromURL().catch(noop);
    
    globalThis.location.hash = origHash;
    server.resetHandlers();
    const result = capturedURL.includes('rev456');
    
    t.ok(result);
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
    
    server.use(http.get('*/api/v1/gist/:id/:revision', () => new HttpResponse(null, {
        status: 404,
    })));
    globalThis.location.hash = '#/gist/missing123';
    
    const result = await fetchFromURL().catch((e) => e);
    
    globalThis.location.hash = origHash;
    server.resetHandlers();
    
    t.match(result.message, 'missing123');
    t.end();
});

test('gist: fetchFromURL: non-404 error throws Unknown error', async (t) => {
    const origHash = globalThis.location.hash;
    
    server.use(http.get('*/api/v1/gist/:id/:revision', () => new HttpResponse(null, {
        status: 500,
    })));
    globalThis.location.hash = '#/gist/someid';
    
    const result = await fetchFromURL().catch((e) => e);
    
    globalThis.location.hash = origHash;
    server.resetHandlers();
    
    t.match(result.message, 'Unknown error');
    t.end();
});

test('gist: create: ok response resolves Revision', async (t) => {
    server.use(http.post('*/api/v1/gist', () => HttpResponse.json(makeGistResponse({
        id: 'new-gist',
        settings: {
            babel: {},
        },
    }))));
    
    const result = await create({
        parserID: 'babel',
        filename: 'source.js',
        code: 'const a = 1;',
    });
    
    server.resetHandlers();
    
    t.equal(result.getSnippetID(), 'new-gist');
    t.end();
});

test('gist: create: error response throws', async (t) => {
    server.use(http.post('*/api/v1/gist', () => new HttpResponse(null, {
        status: 500,
    })));
    
    const result = await create({}).catch((e) => e);
    
    server.resetHandlers();
    
    t.match(result.message, 'Unable to create snippet');
    t.end();
});

test('gist: fork: error response throws', async (t) => {
    server.use(http.post('*/api/v1/gist/:id/:revision', () => new HttpResponse(null, {
        status: 500,
    })));
    
    const fakeRevision = {
        getSnippetID: () => 'abc',
        getRevisionID: () => 'sha1',
    };
    
    const result = await fork(fakeRevision, {}).catch((e) => e);
    
    server.resetHandlers();
    
    t.match(result.message, 'Unable to fork snippet');
    t.end();
});

test('gist: update: sends exactly one request', async (t) => {
    let callCount = 0;
    
    server.use(http.patch('*/api/v1/gist/:id', () => {
        ++callCount;
        return HttpResponse.json(makeGistResponse());
    }));
    
    await update(mockRevision, {
        parserID: 'babel',
        code: 'x',
    });
    
    server.resetHandlers();
    
    t.equal(callCount, 1);
    t.end();
});

test('gist: update: sends PATCH method', async (t) => {
    server.use(http.patch('*/api/v1/gist/:id', ({request}) => {
        t.equal(request.method, 'PATCH');
        return HttpResponse.json(makeGistResponse({
            id: 'gist123',
            version: 'sha1ver',
        }));
    }));
    
    await update(mockRevision, {
        parserID: 'babel',
        code: 'x',
    });
    
    server.resetHandlers();
    t.end();
});

test('gist: fetchFromURL: ok response resolves Revision', async (t) => {
    const origHash = globalThis.location.hash;
    
    server.use(http.get('*/api/v1/gist/:id/:revision', () => HttpResponse.json(makeGistResponse({
        id: 'gist123',
        version: 'sha1ver',
    }))));
    globalThis.location.hash = '#/gist/gist123';
    
    const result = await fetchFromURL() as Revision;
    
    globalThis.location.hash = origHash;
    server.resetHandlers();
    
    t.equal(result.getSnippetID(), 'gist123');
    t.end();
});

test('gist: fork: ok response resolves Revision', async (t) => {
    server.use(http.post('*/api/v1/gist/:id/:revision', () => HttpResponse.json(makeGistResponse({
        id: 'gist123',
        version: 'sha1ver',
    }))));
    
    const fakeRevision = {
        getSnippetID: () => 'abc',
        getRevisionID: () => 'sha1',
    };
    
    const result = await fork(fakeRevision, {});
    
    server.resetHandlers();
    
    t.equal(result.getSnippetID(), 'gist123');
    t.end();
});

test('gist: update: returns Revision instance', async (t) => {
    const result = await update(mockRevision, {
        parserID: 'babel',
        code: 'x',
    });
    
    server.resetHandlers();
    
    const {Revision} = await import('./gist.ts');
    
    t.ok(result instanceof Revision);
    t.end();
});

test('gist: update: throws on non-ok response', async (t) => {
    server.use(http.patch('*/api/v1/gist/:id', () => new HttpResponse(null, {
        status: 500,
    })));
    
    const {tryToCatch} = await import('try-to-catch');
    
    const [error] = await tryToCatch(update, mockRevision, {
        code: 'x',
    });
    
    server.resetHandlers();
    
    t.ok(error);
    t.end();
});

test('gist: owns: returns true for Revision instance', async (t) => {
    const rev = await create({});
    
    server.resetHandlers();
    const result = owns(rev);
    
    t.ok(result);
    t.end();
});

test('gist: v1 source format: getCode returns correct content', (t) => {
    const rev = new Revision({
        id: 'gist-v1',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 1,
                }),
            },
            'code.js': {
                content: 'legacy code',
            },
        },
    });
    
    const result = rev.getCode();
    const expected = 'legacy code';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: canSave returns true', (t) => {
    const rev = new Revision({
        id: 'gist-can-save',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
    
    t.ok(rev.canSave());
    t.end();
});

test('gist: Revision: getPath returns correct path', (t) => {
    const rev = new Revision({
        id: 'gist-path',
        history: [{
            version: 'sha1ver',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
    
    const result = rev.getPath();
    const expected = '/gist/gist-path/sha1ver';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getSnippetID returns correct id', (t) => {
    const rev = new Revision({
        id: 'gist-sid',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
    
    const result = rev.getSnippetID();
    const expected = 'gist-sid';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getRevisionID returns correct version', (t) => {
    const rev = new Revision({
        id: 'gist-revid',
        history: [{
            version: 'v42',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
    
    const result = rev.getRevisionID();
    const expected = 'v42';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getTransformerID returns toolID when set', (t) => {
    const rev = new Revision({
        id: 'gist-tool',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: 'putout',
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const x = 1;',
            },
        },
    });
    
    const result = rev.getTransformerID();
    const expected = 'putout';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getTransformerID returns null when not set', (t) => {
    const rev = new Revision({
        id: 'gist-notool',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
    
    const result = rev.getTransformerID();
    
    t.notOk(result);
    t.end();
});

test('gist: Revision: getTransformCode returns content when transform file exists', (t) => {
    const rev = new Revision({
        id: 'gist-tc',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const x = 1;',
            },
            'transform.js': {
                content: 'module.exports = function() {}',
            },
        },
    });
    
    const result = rev.getTransformCode();
    const expected = 'module.exports = function() {}';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getTransformCode returns empty string when no transform file', (t) => {
    const rev = new Revision({
        id: 'gist-notransform',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
    
    const result = rev.getTransformCode();
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getParserID returns correct parserID', (t) => {
    const rev = new Revision({
        id: 'gist-parserid',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'espree',
                    toolID: null,
                    v: 2,
                    settings: {
                        espree: {},
                    },
                }),
            },
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
    
    const result = rev.getParserID();
    const expected = 'espree';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getParserSettings returns correct settings', (t) => {
    const rev = new Revision({
        id: 'gist-parser-settings',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {
                            sourceType: 'module',
                        },
                    },
                }),
            },
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
    
    t.equal(rev.getParserSettings().sourceType, 'module');
    t.end();
});

test('gist: Revision: getCode returns content for v2 source format', (t) => {
    const rev = new Revision({
        id: 'gist-v2',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const b = 2;',
            },
        },
    });
    
    const result = rev.getCode();
    const expected = 'const b = 2;';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getCode returns empty string for unknown config version', (t) => {
    const rev = new Revision({
        id: 'gist-unknown-v',
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
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
    
    const result = rev.getCode();
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getCode caches result', (t) => {
    const rev = new Revision({
        id: 'gist-cache',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const cached = true;',
            },
        },
    });
    
    rev.getCode();
    const second = rev.getCode();
    
    t.equal(second, 'const cached = true;');
    t.end();
});

test('gist: Revision: getShareData returns object', (t) => {
    const rev = new Revision({
        id: 'gist-share',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
    
    t.ok(rev.getShareData());
    t.end();
});

test('gist: Revision: getShareData versionedURL contains snippetID', (t) => {
    const rev = new Revision({
        id: 'gist-share',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
    
    const result = rev
        .getShareData()
        .versionedURL
        .includes('gist-share');
    
    t.ok(result);
    t.end();
});

test('gist: Revision: getShareData versionedURL contains revisionID', (t) => {
    const rev = new Revision({
        id: 'gist-share',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
    
    const result = rev
        .getShareData()
        .versionedURL
        .includes(rev.getRevisionID());
    
    t.ok(result);
    t.end();
});

test('gist: Revision: getShareData latestURL contains snippetID', (t) => {
    const rev = new Revision({
        id: 'gist-share',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
    
    const result = rev
        .getShareData()
        .latestURL
        .includes('gist-share');
    
    t.ok(result);
    t.end();
});

test('gist: Revision: getShareData has no double slash in latestURL', (t) => {
    const rev = new Revision({
        id: 'gist-share',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
    
    const result = rev
        .getShareData()
        .latestURL
        .replace('https://', '')
        .includes('//');
    
    t.notOk(result);
    t.end();
});

test('gist: Revision: getShareData embedURL is a string', (t) => {
    const rev = new Revision({
        id: 'gist-share',
        history: [{
            version: 'v1',
        }],
        files: {
            'astexplorer.json': {
                content: JSON.stringify({
                    parserID: 'babel',
                    toolID: null,
                    v: 2,
                    settings: {
                        babel: {},
                    },
                }),
            },
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
    
    const result = typeof rev.getShareData().embedURL;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

server.close();
