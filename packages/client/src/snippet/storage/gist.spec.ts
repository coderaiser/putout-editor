<<<<<<< HEAD
import {test} from 'supertape';
import {http, HttpResponse} from 'msw';
=======
import {test, stub} from 'supertape';
>>>>>>> 6b8f62f (test: client: msw)
import {
    matchesURL,
    fetchFromURL,
    owns,
    create,
    update,
    fork,
    Revision,
} from './gist.ts';
<<<<<<< HEAD
import {server} from '../../../test/msw/server.ts';
import {makeGistResponse} from '../../../test/msw/fixtures/gist.ts';

const noop = () => {};

server.listen({
    onUnhandledRequest: 'bypass',
});

=======

const createFetchStub = (result: unknown) => stub().resolves(result) as unknown as typeof fetch;

const noop = () => {};

>>>>>>> 6b8f62f (test: client: msw)
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
    const origFetch = globalThis.fetch;
    
<<<<<<< HEAD
    let capturedURL = '';
    
    server.use(http.get('*/api/v1/gist/:id/:revision', ({request}) => {
        capturedURL = request.url;
        return new HttpResponse(null, {
            status: 404,
        });
    }));
=======
    const fetchStub = stub().resolves({
        ok: false,
        status: 404,
    });
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
    globalThis.location.hash = '#/gist/abc123/rev456';
    
    await fetchFromURL().catch(noop);
    
    globalThis.location.hash = origHash;
<<<<<<< HEAD
    server.resetHandlers();
    const result = capturedURL.includes('rev456');
=======
    globalThis.fetch = origFetch;
    const result = fetchStub.args[0][0].includes('rev456');
>>>>>>> 6b8f62f (test: client: msw)
    
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
    const origFetch = globalThis.fetch;
    
<<<<<<< HEAD
    server.use(http.get('*/api/v1/gist/:id/:revision', () => new HttpResponse(null, {
        status: 404,
    })));
=======
    globalThis.fetch = createFetchStub({
        ok: false,
        status: 404,
    });
>>>>>>> 6b8f62f (test: client: msw)
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
    
<<<<<<< HEAD
    server.use(http.get('*/api/v1/gist/:id/:revision', () => new HttpResponse(null, {
        status: 500,
    })));
=======
    globalThis.fetch = createFetchStub({
        ok: false,
        status: 500,
    });
>>>>>>> 6b8f62f (test: client: msw)
    globalThis.location.hash = '#/gist/someid';
    
    const result = await fetchFromURL().catch((e) => e);
    
    globalThis.location.hash = origHash;
    globalThis.fetch = origFetch;
    
    t.match(result.message, 'Unknown error');
    t.end();
});

test('gist: create: ok response resolves Revision', async (t) => {
<<<<<<< HEAD
    server.use(http.post('*/api/v1/gist', () => HttpResponse.json(makeGistResponse({
        id: 'new-gist',
        settings: {
            babel: {},
        },
    }))));
=======
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
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
<<<<<<< HEAD
    server.use(http.post('*/api/v1/gist', () => new HttpResponse(null, {
        status: 500,
    })));
=======
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
        ok: false,
        status: 500,
    });
>>>>>>> 6b8f62f (test: client: msw)
    
    const result = await create({}).catch((e) => e);
    
    globalThis.fetch = origFetch;
    
    t.match(result.message, 'Unable to create snippet');
    t.end();
});

test('gist: fork: error response throws', async (t) => {
<<<<<<< HEAD
    server.use(http.post('*/api/v1/gist/:id/:revision', () => new HttpResponse(null, {
        status: 500,
    })));
=======
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
        ok: false,
        status: 500,
    });
>>>>>>> 6b8f62f (test: client: msw)
    
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
<<<<<<< HEAD
    let callCount = 0;
    
    server.use(http.patch('*/api/v1/gist/:id', () => {
        ++callCount;
        return HttpResponse.json(makeGistResponse());
    }));
=======
    const origFetch = globalThis.fetch;
    const fetchStub = stub().resolves({
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
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
>>>>>>> 6b8f62f (test: client: msw)
    
    await update(mockRevision, {
        parserID: 'babel',
        code: 'x',
    });
    
    globalThis.fetch = origFetch;
    
    t.calledOnce(fetchStub);
    t.end();
});

test('gist: update: sends PATCH method', async (t) => {
<<<<<<< HEAD
    server.use(http.patch('*/api/v1/gist/:id', ({request}) => {
        t.equal(request.method, 'PATCH');
        return HttpResponse.json(makeGistResponse({
            id: 'gist123',
            version: 'sha1ver',
        }));
    }));
=======
    const origFetch = globalThis.fetch;
    const fetchStub = stub().resolves({
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
    
    globalThis.fetch = fetchStub as unknown as typeof fetch;
>>>>>>> 6b8f62f (test: client: msw)
    
    await update(mockRevision, {
        parserID: 'babel',
        code: 'x',
    });
    
    globalThis.fetch = origFetch;
    
    t.equal(fetchStub.args[0][1].method, 'PATCH');
    t.end();
});

test('gist: fetchFromURL: ok response resolves Revision', async (t) => {
    const origHash = globalThis.location.hash;
    const origFetch = globalThis.fetch;
    
<<<<<<< HEAD
    server.use(http.get('*/api/v1/gist/:id/:revision', () => HttpResponse.json(makeGistResponse({
        id: 'gist123',
        version: 'sha1ver',
    }))));
=======
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    globalThis.location.hash = '#/gist/gist123';
    
    const result = await fetchFromURL() as Revision;
    
    globalThis.location.hash = origHash;
    globalThis.fetch = origFetch;
    
    t.equal(result.getSnippetID(), 'gist123');
    t.end();
});

test('gist: fork: ok response resolves Revision', async (t) => {
<<<<<<< HEAD
    server.use(http.post('*/api/v1/gist/:id/:revision', () => HttpResponse.json(makeGistResponse({
        id: 'gist123',
        version: 'sha1ver',
    }))));
=======
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
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
    
    globalThis.fetch = createFetchStub({
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
    
    const {Revision} = await import('./gist.ts');
    
    t.ok(result instanceof Revision);
    t.end();
});

test('gist: update: throws on non-ok response', async (t) => {
<<<<<<< HEAD
    server.use(http.patch('*/api/v1/gist/:id', () => new HttpResponse(null, {
        status: 500,
    })));
=======
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
        ok: false,
        status: 500,
    });
>>>>>>> 6b8f62f (test: client: msw)
    
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
    
    globalThis.fetch = createFetchStub({
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
    
    globalThis.fetch = createFetchStub({
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

<<<<<<< HEAD
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
=======
test('gist: Revision: canSave returns true', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    t.ok(rev.canSave());
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getPath returns correct path', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = origFetch;
    const result = rev.getPath();
    const expected = '/gist/gist-path/sha1ver';
    
    t.equal(result, expected);
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getSnippetID returns correct id', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = origFetch;
    const result = rev.getSnippetID();
    const expected = 'gist-sid';
    
    t.equal(result, expected);
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getRevisionID returns correct version', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = origFetch;
    const result = rev.getRevisionID();
    const expected = 'v42';
    
    t.equal(result, expected);
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getTransformerID returns toolID when set', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = origFetch;
    const result = rev.getTransformerID();
    const expected = 'putout';
    
    t.equal(result, expected);
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getTransformerID returns null when not set', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = origFetch;
    const result = rev.getTransformerID();
    
    t.notOk(result);
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getTransformCode returns content when transform file exists', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = origFetch;
    const result = rev.getTransformCode();
    const expected = 'module.exports = function() {}';
    
    t.equal(result, expected);
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getTransformCode returns empty string when no transform file', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = origFetch;
    const result = rev.getTransformCode();
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getParserID returns correct parserID', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = origFetch;
    const result = rev.getParserID();
    const expected = 'espree';
    
    t.equal(result, expected);
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getParserSettings returns correct settings', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
                        },
                    },
                }),
            },
<<<<<<< HEAD
            'source.js': {
                content: 'const a = 1;',
            },
        },
    });
=======
        }),
    });
    
    const rev = await create({});
    
    globalThis.fetch = origFetch;
>>>>>>> 6b8f62f (test: client: msw)
    
    t.equal(rev.getParserSettings().sourceType, 'module');
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getCode returns content for v2 source format', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = origFetch;
    const result = rev.getCode();
    const expected = 'const b = 2;';
    
    t.equal(result, expected);
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getCode returns empty string for unknown config version', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = origFetch;
    const result = rev.getCode();
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getCode caches result', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    rev.getCode();
    const second = rev.getCode();
    
    t.equal(second, 'const cached = true;');
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getShareData returns object', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    t.ok(rev.getShareData());
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getShareData versionedURL contains snippetID', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = origFetch;
    const result = rev
        .getShareData()
        .versionedURL
        .includes('gist-share');
    
    t.ok(result);
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getShareData versionedURL contains revisionID', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = origFetch;
    const result = rev
        .getShareData()
        .versionedURL
        .includes(rev.getRevisionID());
    
    t.ok(result);
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getShareData latestURL contains snippetID', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = origFetch;
    const result = rev
        .getShareData()
        .latestURL
        .includes('gist-share');
    
    t.ok(result);
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getShareData has no double slash in latestURL', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = origFetch;
    const result = rev
        .getShareData()
        .latestURL
        .replace('https://', '')
        .includes('//');
    
    t.notOk(result);
    t.end();
});

<<<<<<< HEAD
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
=======
test('gist: Revision: getShareData embedURL is a string', async (t) => {
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = createFetchStub({
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
>>>>>>> 6b8f62f (test: client: msw)
    
    globalThis.fetch = origFetch;
    const result = typeof rev.getShareData().embedURL;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});
