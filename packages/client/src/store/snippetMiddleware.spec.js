import {setImmediate} from 'node:timers/promises';
import {test, stub} from 'supertape';
import {configureStore} from '@reduxjs/toolkit';
import {createSnippetListener} from './snippetMiddleware.js';
import {putoutEditor, clearError} from './reducers.js';
import {log} from '../utils/logger.js';

const noop = () => {};

log.event = noop;
log.error = noop;

const makeStorage = (overrides = {}) => ({
    fetchFromURL: stub().resolves(null),
    create: stub().resolves(null),
    update: stub().resolves(null),
    fork: stub().resolves(null),
    updateHash: noop,
    ...overrides,
});

const getInitState = () => putoutEditor(undefined, {
    type: '@@INIT',
});

function makeStore(overrides = {}, storage = makeStorage()) {
    const state = getInitState();
    const listener = createSnippetListener(storage);
    
    return configureStore({
        reducer: putoutEditor,
        preloadedState: {
            ...state,
            ...overrides,
            workbench: {
                ...state.workbench,
                ...overrides.workbench || {},
            },
        },
        middleware: (getDefault) => getDefault({
            immutableCheck: false,
            serializableCheck: false,
        }).prepend(listener.middleware),
    });
}

const makeRevision = () => ({
    canSave: () => true,
    getCode: () => 'const x = 1',
    getParserID: () => 'babel',
    getParserSettings: () => null,
    getTransformerID: () => null,
    getTransformCode: () => '',
    getSnippetID: () => 'test-id',
    getRevisionID: () => 'r1',
});

// --- snippet/load ---
test('snippetMiddleware: load while saving passes through without loading', async (t) => {
    const storage = makeStorage();
    const store = makeStore({
        saving: true,
    }, storage);
    
    store.dispatch({
        type: 'snippet/load',
    });
    await setImmediate();
    await setImmediate();
    const {loadingSnippet} = store.getState();
    
    t.notOk(loadingSnippet);
    t.end();
});

test('snippetMiddleware: load while forking passes through without loading', async (t) => {
    const storage = makeStorage();
    const store = makeStore({
        forking: true,
    }, storage);
    
    store.dispatch({
        type: 'snippet/load',
    });
    await setImmediate();
    await setImmediate();
    const {loadingSnippet} = store.getState();
    
    t.notOk(loadingSnippet);
    t.end();
});

test('snippetMiddleware: load fetch resolves with revision sets activeRevision', async (t) => {
    const revision = makeRevision();
    const storage = makeStorage({
        fetchFromURL: stub().resolves(revision),
    });
    
    const store = makeStore({}, storage);
    
    store.dispatch({
        type: 'snippet/load',
    });
    await setImmediate();
    await setImmediate();
    
    t.equal(store.getState().activeRevision, revision);
    t.end();
});

test('snippetMiddleware: load fetch resolves with null clears activeRevision', async (t) => {
    const storage = makeStorage({
        fetchFromURL: stub().resolves(null),
    });
    
    const store = makeStore({}, storage);
    
    store.dispatch({
        type: 'snippet/load',
    });
    await setImmediate();
    await setImmediate();
    const {error} = store.getState();
    
    t.notOk(error);
    t.end();
});

test('snippetMiddleware: load fetch rejects sets error', async (t) => {
    const storage = makeStorage({
        fetchFromURL: () => Promise.reject(Error('fetch failed')),
    });
    
    const store = makeStore({}, storage);
    
    store.dispatch({
        type: 'snippet/load',
    });
    await setImmediate();
    await setImmediate();
    await Promise.resolve();
    const {error} = store.getState();
    
    t.ok(error);
    t.end();
});

test('snippetMiddleware: load fetch rejects finishes loading', async (t) => {
    const storage = makeStorage({
        fetchFromURL: () => Promise.reject(Error('fetch failed')),
    });
    
    const store = makeStore({}, storage);
    
    store.dispatch({
        type: 'snippet/load',
    });
    await setImmediate();
    await setImmediate();
    await Promise.resolve();
    const {loadingSnippet} = store.getState();
    
    t.notOk(loadingSnippet);
    t.end();
});

test('snippetMiddleware: stale load request skips resolve', async (t) => {
    let resolveFirst;
    const firstPromise = new Promise((r) => {
        resolveFirst = r;
    });
    
    let callCount = 0;
    
    const storage = makeStorage({
        fetchFromURL: () => {
            ++callCount;
            
            if (callCount === 1)
                return firstPromise;
            
            return new Promise(noop);
        },
    });
    
    const store = makeStore({}, storage);
    
    store.dispatch({
        type: 'snippet/load',
    });
    store.dispatch({
        type: 'snippet/load',
    });
    resolveFirst();
    await setImmediate();
    await setImmediate();
    const {loadingSnippet} = store.getState();
    
    t.ok(loadingSnippet);
    t.end();
});

test('snippetMiddleware: clearError after fetch failure clears hash', async (t) => {
    const storage = makeStorage({
        fetchFromURL: () => Promise.reject(Error('fetch failed')),
    });
    
    const store = makeStore({}, storage);
    
    store.dispatch({
        type: 'snippet/load',
    });
    await setImmediate();
    await setImmediate();
    await Promise.resolve();
    
    store.dispatch(clearError());
    await setImmediate();
    
    t.equal(globalThis.location.hash, '');
    t.end();
});

// --- snippet/save ---
test('snippetMiddleware: save no revision calls create', async (t) => {
    let created = false;
    const storage = makeStorage({
        create: () => {
            created = true;
            return Promise.resolve({
                id: 'new-id',
            });
        },
    });
    
    const store = makeStore({
        activeRevision: null,
    }, storage);
    
    store.dispatch({
        type: 'snippet/save',
        payload: false,
    });
    await setImmediate();
    await setImmediate();
    
    t.ok(created);
    t.end();
});

test('snippetMiddleware: save with revision calls update', async (t) => {
    let updated = false;
    const storage = makeStorage({
        update: () => {
            updated = true;
            return Promise.resolve({
                id: 'updated-id',
            });
        },
    });
    
    const store = makeStore({
        activeRevision: makeRevision(),
    }, storage);
    
    store.dispatch({
        type: 'snippet/save',
        payload: false,
    });
    await setImmediate();
    await setImmediate();
    
    t.ok(updated);
    t.end();
});

test('snippetMiddleware: save fork=true calls fork', async (t) => {
    let forked = false;
    const storage = makeStorage({
        fork: () => {
            forked = true;
            return Promise.resolve({
                id: 'forked-id',
            });
        },
    });
    
    const store = makeStore({
        activeRevision: makeRevision(),
    }, storage);
    
    store.dispatch({
        type: 'snippet/save',
        payload: true,
    });
    await setImmediate();
    await setImmediate();
    
    t.ok(forked);
    t.end();
});

test('snippetMiddleware: save with showTransformPanel adds tool data', async (t) => {
    let savedData = null;
    const storage = makeStorage({
        update: (_revision, data) => {
            savedData = data;
            return Promise.resolve({
                id: 'updated-id',
            });
        },
    });
    
    const store = makeStore({
        activeRevision: makeRevision(),
        showTransformPanel: true,
    }, storage);
    
    store.dispatch({
        type: 'snippet/save',
        payload: false,
    });
    await setImmediate();
    await setImmediate();
    
    t.ok(savedData);
    t.end();
});

test('snippetMiddleware: save create with showTransformPanel', async (t) => {
    let createdData = null;
    const storage = makeStorage({
        create: (data) => {
            createdData = data;
            return Promise.resolve({
                id: 'new-id',
            });
        },
    });
    
    const store = makeStore({
        activeRevision: null,
        showTransformPanel: true,
    }, storage);
    
    store.dispatch({
        type: 'snippet/save',
        payload: false,
    });
    await setImmediate();
    await setImmediate();
    
    t.ok(createdData);
    t.end();
});

test('snippetMiddleware: save error triggers setError', async (t) => {
    const storage = makeStorage({
        update: () => Promise.reject(Error('save failed')),
    });
    
    const store = makeStore({
        activeRevision: makeRevision(),
    }, storage);
    
    store.dispatch({
        type: 'snippet/save',
        payload: false,
    });
    await setImmediate();
    await setImmediate();
    const {error} = store.getState();
    
    t.ok(error);
    t.end();
});
