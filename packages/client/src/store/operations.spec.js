import {test} from 'supertape';
import {tryToCatch} from 'try-to-catch';
import {parseCode, loadSnippetFromURL, saveRevision} from './operations.js';

// --- mock factory ---
// Build the minimum mock parser needed for parseCode.
// Tests override specific methods by spreading.
const makeMockParser = (overrides = {}) => ({
    _promise: null,
    loadParser: (resolve) => resolve({}),
    parse: () => ({type: 'File', body: []}),
    getDefaultOptions: () => ({}),
    opensByDefault: () => false,
    nodeToRange: () => null,
    getNodeName: () => 'File',
    forEachProperty: () => {},
    _ignoredProperties: new Set(),
    locationProps: [],
    typeProps: [],
    ...overrides,
});

// --- parseCode ---

test('operations: parseCode: returns result object on valid input', async (t) => {
    const [error] = await tryToCatch(parseCode, makeMockParser(), 'const x = 1', null);
    t.notOk(error);
    t.end();
});

test('operations: parseCode: result contains ast', async (t) => {
    const [, result] = await tryToCatch(parseCode, makeMockParser(), 'const x = 1', null);
    t.ok(result.ast);
    t.end();
});

test('operations: parseCode: result contains treeAdapter', async (t) => {
    const [, result] = await tryToCatch(parseCode, makeMockParser(), 'const x = 1', null);
    t.ok(result.treeAdapter);
    t.end();
});

test('operations: parseCode: treeAdapter type is default', async (t) => {
    const [, result] = await tryToCatch(parseCode, makeMockParser(), 'const x = 1', null);
    t.equal(result.treeAdapter.type, 'default');
    t.end();
});

test('operations: parseCode: throws when parser.parse throws', async (t) => {
    const parser = makeMockParser({
        parse: () => { throw new Error('unexpected token'); },
    });
    const [error] = await tryToCatch(parseCode, parser, '!!!', null);
    t.ok(error);
    t.end();
});

test('operations: parseCode: error message matches parser error', async (t) => {
    const parser = makeMockParser({
        parse: () => { throw new Error('unexpected token'); },
    });
    const [error] = await tryToCatch(parseCode, parser, '!!!', null);
    t.equal(error.message, 'unexpected token');
    t.end();
});

test('operations: parseCode: uses provided parserSettings', async (t) => {
    let receivedSettings;
    const parser = makeMockParser({
        getDefaultOptions: () => ({ default: true }),
        parse: (_, code, settings) => {
            receivedSettings = settings;
            return {type: 'File', body: []};
        },
    });
    await parseCode(parser, 'x', { custom: true });
    t.deepEqual(receivedSettings, { custom: true });
    t.end();
});

test('operations: parseCode: falls back to getDefaultOptions when no settings', async (t) => {
    let receivedSettings;
    const parser = makeMockParser({
        getDefaultOptions: () => ({ default: true }),
        parse: (_, code, settings) => {
            receivedSettings = settings;
            return {type: 'File', body: []};
        },
    });
    await parseCode(parser, 'x', null);
    t.deepEqual(receivedSettings, { default: true });
    t.end();
});

test('operations: parseCode: reuses existing parser._promise', async (t) => {
    let loadCount = 0;
    const parser = makeMockParser({
        _promise: null,
        loadParser: (resolve) => { loadCount++; resolve({}); },
    });
    await parseCode(parser, 'x', null);
    await parseCode(parser, 'y', null);
    t.equal(loadCount, 1);
    t.end();
});

// --- loadSnippetFromURL ---

test('operations: loadSnippetFromURL: returns revision from storageAdapter', async (t) => {
    const mockRevision = { getCode: () => 'x' };
    const adapter = { fetchFromURL: async () => mockRevision };
    const result = await loadSnippetFromURL(adapter);
    t.equal(result, mockRevision);
    t.end();
});

test('operations: loadSnippetFromURL: returns null when no snippet at URL', async (t) => {
    const adapter = { fetchFromURL: async () => null };
    const result = await loadSnippetFromURL(adapter);
    t.equal(result, null);
    t.end();
});

test('operations: loadSnippetFromURL: propagates storageAdapter errors', async (t) => {
    const adapter = { fetchFromURL: async () => { throw new Error('network error'); } };
    const [error] = await tryToCatch(loadSnippetFromURL, adapter);
    t.ok(error);
    t.end();
});

// --- saveRevision ---

test('operations: saveRevision: calls create when revision is null', async (t) => {
    let called = false;
    const adapter = {
        create: async () => { called = true; },
        update: async () => { throw new Error('should not call update'); },
        fork:   async () => { throw new Error('should not call fork'); },
    };
    await saveRevision(false, {}, null, adapter);
    t.ok(called);
    t.end();
});

test('operations: saveRevision: calls update when revision exists and fork is false', async (t) => {
    let called = false;
    const revision = {};
    const adapter = {
        create: async () => { throw new Error('should not call create'); },
        update: async () => { called = true; },
        fork:   async () => { throw new Error('should not call fork'); },
    };
    await saveRevision(false, {}, revision, adapter);
    t.ok(called);
    t.end();
});

test('operations: saveRevision: calls fork when fork is true', async (t) => {
    let called = false;
    const revision = {};
    const adapter = {
        create: async () => { throw new Error('should not call create'); },
        update: async () => { throw new Error('should not call update'); },
        fork:   async () => { called = true; },
    };
    await saveRevision(true, {}, revision, adapter);
    t.ok(called);
    t.end();
});

test('operations: saveRevision: calls fork even when revision is null', async (t) => {
    let called = false;
    const adapter = {
        create: async () => { throw new Error('should not call create'); },
        update: async () => { throw new Error('should not call update'); },
        fork:   async () => { called = true; },
    };
    await saveRevision(true, {}, null, adapter);
    t.ok(called);
    t.end();
});

test('operations: saveRevision: passes data to create', async (t) => {
    let receivedData;
    const adapter = { create: async (data) => { receivedData = data; } };
    await saveRevision(false, { code: 'x' }, null, adapter);
    t.deepEqual(receivedData, { code: 'x' });
    t.end();
});

test('operations: saveRevision: passes revision and data to update', async (t) => {
    let receivedRevision;
    const revision = { id: 'rev1' };
    const adapter = {
        update: async (rev) => { receivedRevision = rev; },
    };
    await saveRevision(false, {}, revision, adapter);
    t.equal(receivedRevision, revision);
    t.end();
});

test('operations: saveRevision: returns new revision from create', async (t) => {
    const newRevision = { id: 'new1' };
    const adapter = { create: async () => newRevision };
    const result = await saveRevision(false, {}, null, adapter);
    t.equal(result, newRevision);
    t.end();
});
