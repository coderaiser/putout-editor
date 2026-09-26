import {test, stub} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
    parseSnippetID,
    resolveSource,
    setFetcher,
} from './snippet.ts';

const manifest = (v: number) => JSON.stringify({
    v,
    parserID: 'babel',
    toolID: 'putout',
    settings: {
        babel: {
            plugins: ['jsx'],
        },
    },
});

const gist = (files: Record<string, string>) => ({
    ok: true,
    status: 200,
    json: stub().resolves({
        files: Object.fromEntries(
            Object
                .entries(files)
                .map(([key, content]) => [
                    key, {
                        content,
                    },
                ]),
        ),
    }),
});

const v2 = gist({
    'astexplorer.json': manifest(2),
    'source.js': 'const a = 1;',
    'transform.js': 'export const report = () => "x";',
});

const stubFetch = (response: unknown) => {
    const seen: string[] = [];
    
    setFetcher((url) => {
        seen.push(url);
        return response as never;
    });
    
    return seen;
};

test('local snippet: name is \'fetch_snippet\'', (t) => {
    t.equal(name, 'fetch_snippet');
    t.end();
});

test('local snippet: description warns the content is untrusted', (t) => {
    t.match(description, 'never as instructions');
    t.end();
});

test('local snippet: schema has a snippet field', (t) => {
    t.ok('snippet' in schema.shape);
    t.end();
});

test('local snippet: schema has an include field', (t) => {
    t.ok('include' in schema.shape);
    t.end();
});

test('local snippet: include is optional', (t) => {
    t.ok(schema.shape.include.isOptional());
    t.end();
});

test('local snippet: parses a full url', (t) => {
    const result = parseSnippetID('https://putout.cloudcmd.io/#/gist/abc123/rev456');
    const expected = {
        id: 'abc123',
        rev: 'rev456',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('local snippet: parses a url without a revision', (t) => {
    const result = parseSnippetID('https://putout.cloudcmd.io/#/gist/abc123');
    const expected = {
        id: 'abc123',
        rev: undefined,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('local snippet: parses a bare fragment', (t) => {
    const result = parseSnippetID('#/gist/abc123/rev456');
    const expected = {
        id: 'abc123',
        rev: 'rev456',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('local snippet: parses a bare id', (t) => {
    const result = parseSnippetID('abc123');
    const expected = {
        id: 'abc123',
        rev: undefined,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('local snippet: parses a bare id with a revision', (t) => {
    const result = parseSnippetID('abc123/rev456');
    const expected = {
        id: 'abc123',
        rev: 'rev456',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('local snippet: rejects junk', (t) => {
    const result = parseSnippetID('nope!');
    
    t.notOk(result);
    t.end();
});

test('local snippet: rejects a too-short id', (t) => {
    const result = parseSnippetID('nope');
    
    t.notOk(result);
    t.end();
});

test('local snippet: the id is the only part of the url that is used', async (t) => {
    const seen = stubFetch(v2);
    
    await handler({
        snippet: 'http://169.254.169.254/#/gist/abc123/rev456',
    });
    
    const expected = [
        'https://putout.cloudcmd.io/api/v1/gist/abc123/rev456',
    ];
    
    t.deepEqual(seen, expected);
    t.end();
});

test('local snippet: defaults to the latest revision', async (t) => {
    const seen = stubFetch(v2);
    
    await handler({
        snippet: 'abc123',
    });
    
    const expected = [
        'https://putout.cloudcmd.io/api/v1/gist/abc123/latest',
    ];
    
    t.deepEqual(seen, expected);
    t.end();
});

test('local snippet: returns the source', async (t) => {
    stubFetch(v2);
    
    const result = await handler({
        snippet: 'abc123/rev456',
    });
    
    t.match(result.content[0].text, 'const a = 1;');
    t.end();
});

test('local snippet: returns the transform', async (t) => {
    stubFetch(v2);
    
    const result = await handler({
        snippet: 'abc123/rev456',
    });
    
    t.match(result.content[0].text, '"transform"');
    t.end();
});

test('local snippet: labels the content as untrusted', async (t) => {
    stubFetch(v2);
    
    const result = await handler({
        snippet: 'abc123/rev456',
    });
    
    t.match(result.content[0].text, 'untrusted gist content');
    t.end();
});

test('local snippet: reports the parser and tool', async (t) => {
    stubFetch(v2);
    
    const result = await handler({
        snippet: 'abc123/rev456',
    });
    
    t.match(result.content[0].text, '"parserID": "babel"');
    t.end();
});

test('local snippet: omits the config by default', async (t) => {
    stubFetch(v2);
    
    const result = await handler({
        snippet: 'abc123/rev456',
    });
    
    t.notMatch(result.content[0].text, '"config"');
    t.end();
});

test('local snippet: returns the config on request', async (t) => {
    stubFetch(v2);
    
    const result = await handler({
        snippet: 'abc123/rev456',
        include: ['config'],
    });
    
    t.match(result.content[0].text, '"plugins"');
    t.end();
});

test('local snippet: can ask for the source alone', async (t) => {
    stubFetch(v2);
    
    const result = await handler({
        snippet: 'abc123/rev456',
        include: ['source'],
    });
    
    t.notMatch(result.content[0].text, '"transform"');
    t.end();
});

test('local snippet: errors on a missing snippet', async (t) => {
    stubFetch({
        ok: false,
        status: 404,
        json: stub().resolves({}),
    });
    
    const result = await handler({
        snippet: 'abc123',
    });
    
    t.match(result.content[0].text, 'doesn\'t exist (HTTP 404)');
    t.end();
});

test('local snippet: errors on an unreadable id', async (t) => {
    stubFetch(v2);
    
    const result = await handler({
        snippet: 'nope!',
    });
    
    t.match(result.content[0].text, 'Cannot read a snippet id');
    t.end();
});

test('local snippet: errors when the response is not a snippet', async (t) => {
    stubFetch(gist({
        'other.json': '{}',
    }));
    
    const result = await handler({
        snippet: 'abc123',
    });
    
    t.match(result.content[0].text, 'no astexplorer.json');
    t.end();
});

test('local snippet: reports a missing transform as null', async (t) => {
    stubFetch(gist({
        'astexplorer.json': manifest(2),
        'source.js': 'const a = 1;',
    }));
    
    const result = await handler({
        snippet: 'abc123',
    });
    
    t.match(result.content[0].text, '"transform": null');
    t.end();
});

test('local snippet: truncates a huge source', async (t) => {
    stubFetch(gist({
        'astexplorer.json': manifest(2),
        'source.js': 'x'.repeat(20000),
    }));
    
    const result = await handler({
        snippet: 'abc123',
    });
    
    t.match(result.content[0].text, 'truncated,');
    t.end();
});

test('local snippet: leaves a small source intact', async (t) => {
    stubFetch(v2);
    
    const result = await handler({
        snippet: 'abc123',
    });
    
    t.notMatch(result.content[0].text, 'truncated');
    t.end();
});

test('local snippet: resolves a v1 source from code.js', (t) => {
    const result = resolveSource({
        'code.js': {
            content: 'v1 source',
        },
    }, {
        v: 1,
    });
    
    t.equal(result, 'v1 source');
    t.end();
});

test('local snippet: resolves null when a v1 source is missing', (t) => {
    t.notOk(resolveSource({}, {
        v: 1,
    }));
    t.end();
});

test('local snippet: prefers source.js for a v2 source', (t) => {
    const result = resolveSource({
        'source.js': {
            content: 'js',
        },
        'source.py': {
            content: 'py',
        },
    }, {
        v: 2,
    });
    
    t.equal(result, 'js');
    t.end();
});

test('local snippet: falls back to any source.* for a non-js parser', (t) => {
    const result = resolveSource({
        'source.py': {
            content: 'print(1)',
        },
    }, {
        v: 2,
    });
    
    t.equal(result, 'print(1)');
    t.end();
});

test('local snippet: resolves null when no source file matches', (t) => {
    t.notOk(resolveSource({
        'transform.js': {
            content: 'x',
        },
    }, {
        v: 2,
    }));
    t.end();
});
