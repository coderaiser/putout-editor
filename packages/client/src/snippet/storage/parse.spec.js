import {test, stub} from 'supertape';
import {
    matchesURL,
    fetchFromURL,
    owns,
    updateHash,
    Revision,
} from './parse.js';

test('parse: matchesURL: true for snippet hash', (t) => {
    const orig = globalThis.location.hash;
    
    globalThis.location.hash = '#/abc123';
    const result = matchesURL();
    
    globalThis.location.hash = orig;
    
    t.ok(result);
    t.end();
});

test('parse: matchesURL: false for gist hash', (t) => {
    const orig = globalThis.location.hash;
    
    globalThis.location.hash = '#/gist/x';
    const result = matchesURL();
    
    globalThis.location.hash = orig;
    
    t.notOk(result);
    t.end();
});

test('parse: matchesURL: false for empty hash', (t) => {
    const orig = globalThis.location.hash;
    
    globalThis.location.hash = '';
    const result = matchesURL();
    
    globalThis.location.hash = orig;
    
    t.notOk(result);
    t.end();
});

test('parse: owns: false for plain object', (t) => {
    const result = owns({});
    
    t.notOk(result);
    t.end();
});

test('parse: fetchFromURL: resolves null when hash is empty', async (t) => {
    const orig = globalThis.location.hash;
    
    globalThis.location.hash = '';
    const result = await fetchFromURL();
    
    globalThis.location.hash = orig;
    
    t.notOk(result);
    t.end();
});

test('parse: fetchFromURL: resolves Revision when hash is valid', async (t) => {
    const origHash = globalThis.location.hash;
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: true,
        json: stub().resolves({
            snippetID: 'abc',
            revisionID: '1',
            parserID: 'babel',
        }),
    });
    globalThis.location.hash = '#/abc123';
    const result = await fetchFromURL();
    
    globalThis.location.hash = origHash;
    globalThis.fetch = origFetch;
    
    t.ok(result instanceof Revision);
    t.end();
});

test('parse: fetchFromURL: 404 returns error message', async (t) => {
    const origHash = globalThis.location.hash;
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: false,
        status: 404,
    });
    globalThis.location.hash = '#/nonexistent';
    const result = await fetchFromURL().catch((e) => e);
    
    globalThis.location.hash = origHash;
    globalThis.fetch = origFetch;
    
    t.match(result.message, 'doesn\'t exist');
    t.end();
});

test('parse: fetchFromURL: unknown error returns unknown error', async (t) => {
    const origHash = globalThis.location.hash;
    const origFetch = globalThis.fetch;
    
    globalThis.fetch = stub().resolves({
        ok: false,
        status: 500,
    });
    globalThis.location.hash = '#/error';
    const result = await fetchFromURL().catch((e) => e);
    
    globalThis.location.hash = origHash;
    globalThis.fetch = origFetch;
    
    t.match(result.message, 'Unknown error');
    t.end();
});

test('parse: updateHash: sets location hash from revision', (t) => {
    const orig = globalThis.location.hash;
    
    globalThis.location.hash = '';
    const rev = new Revision({
        snippetID: 'abc',
        revisionID: '1',
    });
    
    updateHash(rev);
    const {hash} = globalThis.location;
    
    globalThis.location.hash = orig;
    
    t.equal(hash, '#/abc/1');
    t.end();
});

test('parse: Revision: canSave returns false', (t) => {
    const rev = new Revision({
        snippetID: 'abc',
        revisionID: '1',
    });
    
    t.notOk(rev.canSave());
    t.end();
});

test('parse: Revision: getSnippetID', (t) => {
    const rev = new Revision({
        snippetID: 'abc',
        revisionID: '1',
    });
    
    const result = rev.getSnippetID();
    const expected = 'abc';
    
    t.equal(result, expected);
    t.end();
});

test('parse: Revision: getRevisionID', (t) => {
    const rev = new Revision({
        snippetID: 'abc',
        revisionID: '1',
    });
    
    const result = rev.getRevisionID();
    const expected = '1';
    
    t.equal(result, expected);
    t.end();
});

test('parse: Revision: getPath with revision', (t) => {
    const rev = new Revision({
        snippetID: 'abc',
        revisionID: '1',
    });
    
    const result = rev.getPath();
    const expected = '/abc/1';
    
    t.equal(result, expected);
    t.end();
});

test('parse: Revision: getPath without revision', (t) => {
    const rev = new Revision({
        snippetID: 'abc',
        revisionID: '',
    });
    
    const result = rev.getPath();
    const expected = '/abc';
    
    t.equal(result, expected);
    t.end();
});

test('parse: Revision: getParserID from data', (t) => {
    const rev = new Revision({
        parserID: 'babel',
    });
    
    const result = rev.getParserID();
    const expected = 'babel';
    
    t.equal(result, expected);
    t.end();
});

test('parse: Revision: getCode from data', (t) => {
    const rev = new Revision({
        parserID: 'babel',
        code: 'const x = 1',
    });
    
    const result = rev.getCode();
    const expected = 'const x = 1';
    
    t.equal(result, expected);
    t.end();
});

test('parse: Revision: getTransformerID returns undefined', (t) => {
    const rev = new Revision({
        parserID: 'babel',
    });
    
    t.notOk(rev.getTransformerID());
    t.end();
});

test('parse: Revision: getTransformCode returns empty string', (t) => {
    const rev = new Revision({
        parserID: 'babel',
    });
    
    const result = rev.getTransformCode();
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});

test('parse: Revision: getTransformCode returns transform when provided', (t) => {
    const rev = new Revision({
        parserID: 'babel',
        transform: 'module.exports = "custom"',
        toolID: 'putout',
    });
    
    const result = rev.getTransformCode();
    const expected = 'module.exports = "custom"';
    
    t.equal(result, expected);
    t.end();
});

test('parse: Revision: getParserID uses transformer defaultParserID when toolID set', (t) => {
    const rev = new Revision({
        toolID: 'putout',
        parserID: 'espree',
    });
    
    const result = rev.getParserID();
    const expected = 'babel';
    
    t.equal(result, expected);
    t.end();
});

test('parse: Revision: getCode falls back to parser example when no code', (t) => {
    const rev = new Revision({
        parserID: 'babel',
    });
    
    t.ok(rev.getCode().length > 0);
    t.end();
});

test('parse: Revision: getParserSettings parses settings for parserID', (t) => {
    const rev = new Revision({
        parserID: 'babel',
        settings: {
            babel: '{}',
        },
    });
    
    const result = rev.getParserSettings();
    const expected = {};
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: Revision: getShareData returns object', (t) => {
    const rev = new Revision({
        snippetID: 'abc',
        revisionID: '1',
        code: 'x',
        parserID: 'babel',
    });
    
    t.ok(rev.getShareData());
    t.end();
});

test('parse: Revision: getShareData versionedURL contains snippetID', (t) => {
    const rev = new Revision({
        snippetID: 'abc',
        revisionID: '1',
        code: 'x',
        parserID: 'babel',
    });
    
    const result = rev
        .getShareData()
        .versionedURL
        .includes('abc');
    
    t.ok(result);
    t.end();
});

test('parse: Revision: getShareData versionedURL has no double slash', (t) => {
    const rev = new Revision({
        snippetID: 'abc',
        revisionID: '1',
        code: 'x',
        parserID: 'babel',
    });
    
    const result = rev
        .getShareData()
        .versionedURL
        .replace('https://', '')
        .includes('//');
    
    t.notOk(result);
    t.end();
});

test('parse: Revision: getShareData latestURL is null', (t) => {
    const rev = new Revision({
        snippetID: 'abc',
        revisionID: '1',
        code: 'x',
        parserID: 'babel',
    });
    
    const {latestURL} = rev.getShareData();
    
    t.notOk(latestURL);
    t.end();
});

test('parse: Revision: getShareData embedURL is null', (t) => {
    const rev = new Revision({
        snippetID: 'abc',
        revisionID: '1',
        code: 'x',
        parserID: 'babel',
    });
    
    const {embedURL} = rev.getShareData();
    
    t.notOk(embedURL);
    t.end();
});

test('parse: updateHash: sets location hash without revision when empty', (t) => {
    const orig = globalThis.location.hash;
    
    globalThis.location.hash = '';
    const rev = new Revision({
        snippetID: 'abc',
        revisionID: '',
    });
    
    updateHash(rev);
    const {hash} = globalThis.location;
    
    globalThis.location.hash = orig;
    
    t.equal(hash, '#/abc');
    t.end();
});

test('parse: Revision: getParserSettings returns null when missing settings key', (t) => {
    const rev = new Revision({
        parserID: 'babel',
        settings: {},
    });
    
    t.notOk(rev.getParserSettings());
    t.end();
});

test('parse: Revision: getParserSettings returns null when settings null', (t) => {
    const rev = new Revision({
        parserID: 'babel',
        settings: null,
    });
    
    const result = rev.getParserSettings();
    
    t.notOk(result);
    t.end();
});

test('parse: Revision: getTransformCode returns defaultTransform when toolID set', (t) => {
    const rev = new Revision({
        toolID: 'putout',
    });
    
    const code = rev.getTransformCode();
    
    t.ok(code.length > 0);
    t.end();
});
