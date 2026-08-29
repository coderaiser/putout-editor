import {setImmediate} from 'node:timers/promises';
import {test, stub} from 'supertape';
import {configureStore} from '@reduxjs/toolkit';
import {formatListener} from './formatMiddleware.js';
import {
    putoutEditor,
    editorBlur,
    setParseResult,
} from './reducers.js';

const getInitState = () => putoutEditor(undefined, {type: '@@INIT'});

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
        })
            .prepend(formatListener.middleware),
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
                id: {type: 'Identifier', name: 'x'},
                init: {type: 'NumericLiteral', value: 1},
            }],
        }],
        directives: [],
    },
});

test('formatMiddleware: editorBlur with valid ast formats code', async (t) => {
    const store = makeStore();
    const ast = makeAST();
    
    store.dispatch(setParseResult({ast, error: null, time: 1, treeAdapter: null}));
    store.dispatch(editorBlur());
    
    await setImmediate();
    
    const code = store.getState().workbench.code;
    
    t.equal(code, 'const x = 1;\n');
    t.end();
});

test('formatMiddleware: editorBlur without ast does nothing', async (t) => {
    const store = makeStore({workbench: {parseResult: {ast: null, error: null}}});
    const before = store.getState().workbench.code;
    
    store.dispatch(editorBlur());
    
    await setImmediate();
    
    t.equal(store.getState().workbench.code, before);
    t.end();
});

test('formatMiddleware: editorBlur does not dispatch when formatted equals code', async (t) => {
    const store = makeStore();
    const ast = makeAST();
    
    store.dispatch(setParseResult({ast, error: null, time: 1, treeAdapter: null}));
    
    // First blur formats and sets code to 'const x = 1;\n'
    store.dispatch(editorBlur());
    await setImmediate();
    
    const dispatchSpy = stub(store, 'dispatch');
    
    // Second blur: code already matches formatted output
    store.dispatch(editorBlur());
    await setImmediate();
    
    t.notOk(dispatchSpy.called);
    t.end();
});

test('formatMiddleware: editorBlur does not dispatch when print throws', async (t) => {
    const store = makeStore();
    // UnknownNode123 type causes @putout/printer to throw
    const badAST = {type: 'UnknownNode123'};
    
    store.dispatch(setParseResult({ast: badAST, error: null, time: 1, treeAdapter: null}));
    
    const before = store.getState().workbench.code;
    
    store.dispatch(editorBlur());
    await setImmediate();
    
    t.equal(store.getState().workbench.code, before);
    t.end();
});
