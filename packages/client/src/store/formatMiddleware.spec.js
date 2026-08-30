import {setImmediate} from 'node:timers/promises';
import {test} from 'supertape';
import {configureStore} from '@reduxjs/toolkit';
import {formatListener} from './formatMiddleware.js';
import {
    putoutEditor,
    editorBlur,
    transformBlur,
    setParseResult,
} from './reducers.js';

const getInitState = () => putoutEditor(undefined, {
    type: '@@INIT',
});

function makeStore(overrides = {}) {
    const state = getInitState();
    
    return configureStore({
        reducer: putoutEditor,
        preloadedState: {
            ...state,
            workbench: {
                ...state.workbench,
                ...overrides.workbench,
            },
        },
        middleware: (getDefault) => getDefault({
            immutableCheck: false,
            serializableCheck: false,
        }).prepend(formatListener.middleware),
    });
}

const makeAST = () => ({
    type: 'File',
    program: {
        type: 'Program',
        sourceType: 'module',
        body: [{
            type: 'VariableDeclaration',
            kind: 'const',
            declarations: [{
                type: 'VariableDeclarator',
                id: {
                    type: 'Identifier',
                    name: 'x',
                },
                init: {
                    type: 'NumericLiteral',
                    value: 1,
                },
            }],
        }],
        directives: [],
    },
});

// ─── editorBlur ───────────────────────────────────────────────────────────────
test('formatMiddleware: editorBlur with valid ast formats code', async (t) => {
    const store = makeStore();
    const ast = makeAST();
    
    store.dispatch(setParseResult({
        ast,
        error: null,
        time: 1,
        treeAdapter: null,
    }));
    store.dispatch(editorBlur());
    
    await setImmediate();
    
    t.equal(store.getState().workbench.code, 'const x = 1;\n');
    t.end();
});

test('formatMiddleware: editorBlur without ast does nothing', async (t) => {
    const store = makeStore({
        workbench: {
            parseResult: {
                ast: null,
                error: null,
            },
        },
    });
    
    const before = store.getState().workbench.code;
    
    store.dispatch(editorBlur());
    
    await setImmediate();
    
    t.equal(store.getState().workbench.code, before);
    t.end();
});

test('formatMiddleware: editorBlur does not dispatch when formatted equals code', async (t) => {
    const store = makeStore();
    const ast = makeAST();
    
    store.dispatch(setParseResult({
        ast,
        error: null,
        time: 1,
        treeAdapter: null,
    }));
    store.dispatch(editorBlur());
    await setImmediate();
    
    const before = store.getState().workbench.code;
    
    store.dispatch(setParseResult({
        ast,
        error: null,
        time: 1,
        treeAdapter: null,
    }));
    store.dispatch(editorBlur());
    await setImmediate();
    
    t.equal(store.getState().workbench.code, before);
    t.end();
});

test('formatMiddleware: editorBlur does not dispatch when print throws', async (t) => {
    const store = makeStore();
    const badAST = {
        type: 'UnknownNode123',
    };
    
    store.dispatch(setParseResult({
        ast: badAST,
        error: null,
        time: 1,
        treeAdapter: null,
    }));
    
    const before = store.getState().workbench.code;
    
    store.dispatch(editorBlur());
    await setImmediate();
    
    t.equal(store.getState().workbench.code, before);
    t.end();
});

// ─── transformBlur ────────────────────────────────────────────────────────────
test('formatMiddleware: transformBlur with valid code formats transform', async (t) => {
    const store = makeStore({
        workbench: {
            transform: {
                code: 'export const replace=()=>({})',
                initialCode: '',
                transformer: 'putout',
            },
        },
    });
    
    store.dispatch(transformBlur());
    await setImmediate();
    
    const {code} = store.getState().workbench.transform;
    
    t.notEqual(code, 'export const replace=()=>({})');
    t.end();
});

test('formatMiddleware: transformBlur with empty code does nothing', async (t) => {
    const store = makeStore({
        workbench: {
            transform: {
                code: '',
                initialCode: '',
                transformer: 'putout',
            },
        },
    });
    
    store.dispatch(transformBlur());
    await setImmediate();
    
    t.equal(store.getState().workbench.transform.code, '');
    t.end();
});

test('formatMiddleware: transformBlur with invalid code does nothing', async (t) => {
    const bad = 'export const = 1';
    const store = makeStore({
        workbench: {
            transform: {
                code: bad,
                initialCode: '',
                transformer: 'putout',
            },
        },
    });
    
    store.dispatch(transformBlur());
    await setImmediate();
    
    t.equal(store.getState().workbench.transform.code, bad);
    t.end();
});

test('formatMiddleware: transformBlur does not dispatch when formatted equals code', async (t) => {
    const store = makeStore({
        workbench: {
            transform: {
                code: 'export const replace = () => ({});\n',
                initialCode: '',
                transformer: 'putout',
            },
        },
    });
    
    store.dispatch(transformBlur());
    await setImmediate();
    
    t.equal(store.getState().workbench.transform.code, 'export const replace = () => ({});\n');
    t.end();
});
