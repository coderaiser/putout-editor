import {test} from 'supertape';
import createMiddleware from './snippetMiddleware.js';
import * as actions from './actions.js';

const noop = () => {};

const makeStorage = (overrides = {}) => ({
    fetchFromURL: async () => null,
    create: async () => null,
    update: async () => null,
    fork: async () => null,
    updateHash: noop,
    ...overrides,
});

const getState = (overrides = {}) => ({
    activeRevision: null,
    showTransformPanel: false,
    workbench: {
        parser: 'babel',
        parserSettings: null,
        code: 'x',
        initialCode: 'x',
        transform: {
            code: 't',
            initialCode: 't',
            transformer: 'putout',
        },
    },
    ...overrides,
});

function apply(storageAdapter, store) {
    const nexted = [];
    const dispatch = createMiddleware(storageAdapter)(store)((a) => nexted.push(a));
    
    return {
        dispatch,
        nexted,
    };
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

test('snippetMiddleware: default action passed to next', (t) => {
    const storage = makeStorage();
    const store = {
        getState,
    };
    const {dispatch, nexted} = apply(storage, store);
    const action = {
        type: 'UNKNOWN',
    };
    
    dispatch(action);
    
    t.equal(nexted[0], action);
    t.end();
});

test('snippetMiddleware: CLEAR_ERROR passed to next', (t) => {
    const storage = makeStorage();
    const store = {
        getState,
    };
    const {dispatch, nexted} = apply(storage, store);
    
    dispatch(actions.clearError());
    
    t.equal(nexted[0].type, 'CLEAR_ERROR');
    t.end();
});

test('snippetMiddleware: LOAD_SNIPPET while saving passes through type', (t) => {
    const storage = makeStorage();
    const store = {
        getState: () => getState({
            saving: true,
        }),
    };
    const {dispatch, nexted} = apply(storage, store);
    
    dispatch(actions.loadSnippet());
    
    t.equal(nexted[0].type, 'LOAD_SNIPPET');
    t.end();
});

test('snippetMiddleware: LOAD_SNIPPET while saving only one action', (t) => {
    const storage = makeStorage();
    const store = {
        getState: () => getState({
            saving: true,
        }),
    };
    const {dispatch, nexted} = apply(storage, store);
    
    dispatch(actions.loadSnippet());
    
    t.equal(nexted.length, 1);
    t.end();
});

test('snippetMiddleware: LOAD_SNIPPET while forking passes through', (t) => {
    const storage = makeStorage();
    const store = {
        getState: () => getState({
            forking: true,
        }),
    };
    const {dispatch, nexted} = apply(storage, store);
    
    dispatch(actions.loadSnippet());
    
    t.equal(nexted[0].type, 'LOAD_SNIPPET');
    t.end();
});

test('snippetMiddleware: LOAD_SNIPPET while forking only one action', (t) => {
    const storage = makeStorage();
    const store = {
        getState: () => getState({
            forking: true,
        }),
    };
    const {dispatch, nexted} = apply(storage, store);
    
    dispatch(actions.loadSnippet());
    
    t.equal(nexted.length, 1);
    t.end();
});

test('snippetMiddleware: LOAD_SNIPPET fetch resolves with SET_SNIPPET', async (t) => {
    const revision = {
        id: 'rev-1',
    };
    const storage = makeStorage({
        fetchFromURL: async () => revision,
    });
    const store = {
        getState,
    };
    const {dispatch, nexted} = apply(storage, store);
    
    dispatch(actions.loadSnippet());
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    const types = [];
    
    for (const a of nexted) {
        types.push(a.type);
    }
    
    const result = types.includes('SET_SNIPPET');
    
    t.ok(result);
    t.end();
});

test('snippetMiddleware: LOAD_SNIPPET fetch resolves with DONE_LOADING', async (t) => {
    const revision = {
        id: 'rev-1',
    };
    const storage = makeStorage({
        fetchFromURL: async () => revision,
    });
    const store = {
        getState,
    };
    const {dispatch, nexted} = apply(storage, store);
    
    dispatch(actions.loadSnippet());
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    const types = [];
    
    for (const a of nexted) {
        types.push(a.type);
    }
    
    const result = types.includes('DONE_LOADING_SNIPPET');
    
    t.ok(result);
    t.end();
});

test('snippetMiddleware: LOAD_SNIPPET fetch resolves with null', async (t) => {
    const storage = makeStorage({
        fetchFromURL: async () => null,
    });
    const store = {
        getState,
    };
    const {dispatch, nexted} = apply(storage, store);
    
    dispatch(actions.loadSnippet());
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    const types = [];
    
    for (const a of nexted) {
        types.push(a.type);
    }
    
    const result = types.includes('CLEAR_SNIPPET');
    
    t.ok(result);
    t.end();
});

test('snippetMiddleware: LOAD_SNIPPET fetch rejects sets error', async (t) => {
    const storage = makeStorage({
        fetchFromURL: () => Promise.reject(Error('fetch failed')),
    });
    const store = {
        getState,
    };
    const {dispatch, nexted} = apply(storage, store);
    
    dispatch(actions.loadSnippet());
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    const types = [];
    
    for (const a of nexted) {
        types.push(a.type);
    }
    
    const result = types.includes('SET_ERROR');
    
    t.ok(result);
    t.end();
});

test('snippetMiddleware: LOAD_SNIPPET fetch rejects done loading', async (t) => {
    const storage = makeStorage({
        fetchFromURL: () => Promise.reject(Error('fetch failed')),
    });
    const store = {
        getState,
    };
    const {dispatch, nexted} = apply(storage, store);
    
    dispatch(actions.loadSnippet());
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    const types = [];
    
    for (const a of nexted) {
        types.push(a.type);
    }
    
    const result = types.includes('DONE_LOADING_SNIPPET');
    
    t.ok(result);
    t.end();
});

test('snippetMiddleware: SAVE no revision calls create', async (t) => {
    let created = false;
    const storage = makeStorage({
        create: () => {
            created = true;
            return Promise.resolve({
                id: 'new-id',
            });
        },
        updateHash: noop,
    });
    
    const store = {
        getState: () => getState({
            activeRevision: null,
        }),
    };
    const {dispatch} = apply(storage, store);
    
    dispatch(actions.save(false));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    
    t.ok(created);
    t.end();
});

test('snippetMiddleware: SAVE with revision calls update', async (t) => {
    let updated = false;
    const rev = makeRevision();
    
    const storage = makeStorage({
        update: () => {
            updated = true;
            return Promise.resolve({
                id: 'updated-id',
            });
        },
        updateHash: noop,
    });
    
    const store = {
        getState: () => getState({
            activeRevision: rev,
        }),
    };
    const {dispatch} = apply(storage, store);
    
    dispatch(actions.save(false));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    
    t.ok(updated);
    t.end();
});

test('snippetMiddleware: SAVE fork=true calls fork', async (t) => {
    let forked = false;
    const rev = makeRevision();
    
    const storage = makeStorage({
        fork: () => {
            forked = true;
            return Promise.resolve({
                id: 'forked-id',
            });
        },
        updateHash: noop,
    });
    
    const store = {
        getState: () => getState({
            activeRevision: rev,
        }),
    };
    const {dispatch} = apply(storage, store);
    
    dispatch(actions.save(true));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    
    t.ok(forked);
    t.end();
});

test('snippetMiddleware: SAVE with showTransformPanel adds tool data', async (t) => {
    let savedData = null;
    const rev = makeRevision();
    
    const storage = makeStorage({
        update: (revision, data) => {
            savedData = data;
            return Promise.resolve({
                id: 'updated-id',
            });
        },
        updateHash: noop,
    });
    
    const store = {
        getState: () => getState({
            activeRevision: rev,
            showTransformPanel: true,
        }),
    };
    const {dispatch} = apply(storage, store);
    
    dispatch(actions.save(false));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    
    t.ok(savedData);
    t.end();
});

test('snippetMiddleware: SAVE create with showTransformPanel', async (t) => {
    let createdData = null;
    const storage = makeStorage({
        create: (data) => {
            createdData = data;
            return Promise.resolve({
                id: 'new-id',
            });
        },
        updateHash: noop,
    });
    
    const store = {
        getState: () => getState({
            activeRevision: null,
            showTransformPanel: true,
        }),
    };
    const {dispatch} = apply(storage, store);
    
    dispatch(actions.save(false));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    
    t.ok(createdData);
    t.end();
});

test('snippetMiddleware: SAVE error triggers setError', async (t) => {
    const storage = makeStorage({
        update: () => Promise.reject(Error('save failed')),
        updateHash: noop,
    });
    
    const rev = makeRevision();
    const store = {
        getState: () => getState({
            activeRevision: rev,
        }),
    };
    const {dispatch, nexted} = apply(storage, store);
    
    dispatch(actions.save(false));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    const types = [];
    
    for (const a of nexted) {
        types.push(a.type);
    }
    
    const result = types.includes('SET_ERROR');
    
    t.ok(result);
    t.end();
});
