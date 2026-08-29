import {test, stub} from 'supertape';
import {
    matchesURL,
    fetchFromURL,
    owns,
    create,
    update,
    fork,
} from './gist.js';

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

test('gist: update: sends exactly one request', async (t) => {
    const origFetch = globalThis.fetch;
    let callCount = 0;
    
    globalThis.fetch = () => {
        callCount++;
        return {
            ok: true,
            json: stub().resolves({
                id: 'gist123',
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
            }),
        };
    };
    
    await update(mockRevision, {
        parserID: 'babel',
        code: 'x',
    });
    
    globalThis.fetch = origFetch;
    
    t.equal(callCount, 1);
    t.end();
});

test('gist: update: sends PATCH method', async (t) => {
    const origFetch = globalThis.fetch;
    let method;
    
    globalThis.fetch = (url, opts) => {
        ({method} = opts);
        return {
            ok: true,
            json: stub().resolves({
                id: 'gist123',
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
            }),
        };
    };
    
    await update(mockRevision, {
        parserID: 'babel',
        code: 'x',
    });
    
    globalThis.fetch = origFetch;
    
    t.equal(method, 'PATCH');
    t.end();
});

test('gist: fetchFromURL: ok response resolves Revision', async (t) => {
    const origHash = globalThis.location.hash;
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
            id: 'gist123',
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
        }),
    });
    globalThis.location.hash = '#/gist/gist123';
    
    const result = await fetchFromURL();
    
    globalThis.location.hash = origHash;
    globalThis.fetch = origFetch;
    
    t.equal(result.getSnippetID(), 'gist123');
    t.end();
});

test('gist: fork: ok response resolves Revision', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
            id: 'gist123',
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
        }),
    });
    
    const fakeRevision = {
        getSnippetID: () => 'abc',
        getRevisionID: () => 'sha1',
    };
    
    const result = await fork(fakeRevision, {});
    
    globalThis.fetch = origFetch;
    
    t.equal(result.getSnippetID(), 'gist123');
    t.end();
});

test('gist: update: returns Revision instance', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
            id: 'gist123',
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
        }),
    });
    
    const result = await update(mockRevision, {
        parserID: 'babel',
        code: 'x',
    });
    
    globalThis.fetch = origFetch;
    
    const {Revision} = await import('./gist.js');
    
    t.ok(result instanceof Revision);
    t.end();
});

test('gist: update: throws on non-ok response', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: false,
        status: 500,
    });
    
    const {tryToCatch} = await import('try-to-catch');
    
    const [error] = await tryToCatch(update, mockRevision, {
        code: 'x',
    });
    
    globalThis.fetch = origFetch;
    
    t.ok(error);
    t.end();
});

test('gist: owns: returns true for Revision instance', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
            id: 'owns-test',
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = owns(rev);
    
    t.ok(result);
    t.end();
});

test('gist: v1 source format: getCode returns correct content', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = rev.getCode();
    const expected = 'legacy code';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: canSave returns true', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    
    t.ok(rev.canSave());
    t.end();
});

test('gist: Revision: getPath returns correct path', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = rev.getPath();
    const expected = '/gist/gist-path/sha1ver';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getSnippetID returns correct id', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = rev.getSnippetID();
    const expected = 'gist-sid';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getRevisionID returns correct version', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = rev.getRevisionID();
    const expected = 'v42';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getTransformerID returns toolID when set', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = rev.getTransformerID();
    const expected = 'putout';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getTransformerID returns null when not set', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = rev.getTransformerID();
    
    t.notOk(result);
    t.end();
});

test('gist: Revision: getTransformCode returns content when transform file exists', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = rev.getTransformCode();
    const expected = 'module.exports = function() {}';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getTransformCode returns empty string when no transform file', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = rev.getTransformCode();
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getParserID returns correct parserID', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = rev.getParserID();
    const expected = 'espree';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getParserSettings returns correct settings', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    
    t.equal(rev.getParserSettings().sourceType, 'module');
    t.end();
});

test('gist: Revision: getCode returns content for v2 source format', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = rev.getCode();
    const expected = 'const b = 2;';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getCode returns empty string for unknown config version', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = rev.getCode();
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});

test('gist: Revision: getCode caches result', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    
    rev.getCode();
    const second = rev.getCode();
    
    t.equal(second, 'const cached = true;');
    t.end();
});

test('gist: Revision: getShareData returns object', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    
    t.ok(rev.getShareData());
    t.end();
});

test('gist: Revision: getShareData versionedURL contains snippetID', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = rev
        .getShareData()
        .versionedURL
        .includes('gist-share');
    
    t.ok(result);
    t.end();
});

test('gist: Revision: getShareData versionedURL contains revisionID', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = rev
        .getShareData()
        .versionedURL
        .includes(rev.getRevisionID());
    
    t.ok(result);
    t.end();
});

test('gist: Revision: getShareData latestURL contains snippetID', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = rev
        .getShareData()
        .latestURL
        .includes('gist-share');
    
    t.ok(result);
    t.end();
});

test('gist: Revision: getShareData has no double slash in latestURL', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = rev
        .getShareData()
        .latestURL
        .replace('https://', '')
        .includes('//');
    
    t.notOk(result);
    t.end();
});

test('gist: Revision: getShareData embedURL is a string', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
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
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
    const result = typeof rev.getShareData().embedURL;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});
