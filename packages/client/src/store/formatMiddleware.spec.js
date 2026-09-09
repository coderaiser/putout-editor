import {setImmediate} from 'node:timers/promises';
import {test} from 'supertape';
import {configureStore} from '@reduxjs/toolkit';
import {formatListener} from './formatMiddleware.ts';
import {
    putoutEditor,
    editorKeydown,
    transformKeydown,
    setCode,
    setTransformState,
    setParseResult,
} from './reducers.ts';

const getInitState = () => putoutEditor(undefined, {
    type: '@@INIT',
});

const settle = async (count = 10) => {
    for (let i = 0; i < count; i++)
        await setImmediate();
};

const waitFor = async (fn, ms = 3000) => {
    const start = Date.now();
    
    while (!fn() && Date.now() - start < ms)
        await setImmediate();
};

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

const setASTFor = (store) => {
    store.dispatch(setParseResult({
        ast: {
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
                            type: 'UnaryExpression',
                            operator: '-',
                            prefix: true,
                            argument: {
                                type: 'NumericLiteral',
                                value: 1,
                            },
                        },
                    }],
                }],
                directives: [],
            },
        },
        error: null,
        time: 1,
        treeAdapter: null,
    }));
};

// ─── editorKeydown ────────────────────────────────────────────────────────────
test('formatMiddleware: editorKeydown formats code', async (t) => {
    const store = makeStore({
        workbench: {
            code: 'const x=-1',
        },
    });
    
    setASTFor(store);
    store.dispatch(editorKeydown());
    
    await waitFor(() => store.getState().workbench.code === 'const x = -1;');
    
    t.equal(store.getState().workbench.code, 'const x = -1;');
    t.end();
});

test('formatMiddleware: editorKeydown keeps trailing newline', async (t) => {
    const store = makeStore({
        workbench: {
            code: 'const x=-1;\n',
        },
    });
    
    setASTFor(store);
    store.dispatch(editorKeydown());
    
    await waitFor(() => store.getState().workbench.code === 'const x = -1;\n');
    
    t.equal(store.getState().workbench.code, 'const x = -1;\n');
    t.end();
});

test('formatMiddleware: editorKeydown does nothing without ast', async (t) => {
    const store = makeStore({
        workbench: {
            code: 'const x=-1',
        },
    });
    
    store.dispatch(editorKeydown());
    
    await settle();
    
    t.equal(store.getState().workbench.code, 'const x=-1');
    t.end();
});

test('formatMiddleware: editorKeydown does nothing when already formatted', async (t) => {
    const formatted = 'const x = -1;';
    const store = makeStore({
        workbench: {
            code: formatted,
        },
    });
    
    setASTFor(store);
    store.dispatch(editorKeydown());
    
    await settle();
    
    t.equal(store.getState().workbench.code, formatted);
    t.end();
});

test('formatMiddleware: editorKeydown bails out when code changed while formatting', async (t) => {
    const store = makeStore({
        workbench: {
            code: 'const x=-1',
        },
    });
    
    setASTFor(store);
    store.dispatch(editorKeydown());
    store.dispatch(setCode({
        code: 'const changed = 1;',
        cursor: 0,
    }));
    
    await settle();
    
    t.equal(store.getState().workbench.code, 'const changed = 1;');
    t.end();
});

// ─── transformKeydown ─────────────────────────────────────────────────────────
test('formatMiddleware: transformKeydown formats code', async (t) => {
    const store = makeStore({
        workbench: {
            transform: {
                code: 'export const replace=()=>({})',
                initialCode: '',
                transformer: 'putout',
            },
        },
    });
    
    store.dispatch(transformKeydown());
    
    await waitFor(() => store.getState().workbench.transform.code === 'export const replace = () => ({});');
    
    t.equal(store.getState().workbench.transform.code, 'export const replace = () => ({});');
    t.end();
});

test('formatMiddleware: transformKeydown with empty code does nothing', async (t) => {
    const store = makeStore({
        workbench: {
            transform: {
                code: '',
                initialCode: '',
                transformer: 'putout',
            },
        },
    });
    
    store.dispatch(transformKeydown());
    
    await settle();
    
    t.equal(store.getState().workbench.transform.code, '');
    t.end();
});

test('formatMiddleware: transformKeydown with invalid code does nothing', async (t) => {
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
    
    store.dispatch(transformKeydown());
    
    await settle();
    
    t.equal(store.getState().workbench.transform.code, bad);
    t.end();
});

test('formatMiddleware: transformKeydown does nothing when already formatted', async (t) => {
    const formatted = 'export const replace = () => ({});';
    const store = makeStore({
        workbench: {
            transform: {
                code: formatted,
                initialCode: '',
                transformer: 'putout',
            },
        },
    });
    
    store.dispatch(transformKeydown());
    
    await settle();
    
    t.equal(store.getState().workbench.transform.code, formatted);
    t.end();
});
