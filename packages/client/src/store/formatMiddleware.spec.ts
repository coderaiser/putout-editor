import {setImmediate} from 'node:timers/promises';
import {test} from 'supertape';
import {montag} from 'montag';
import plugins from '@putout/engine-parser/babel/plugins';
import {
    makeStore as makeTestStore,
    type StoreOverrides,
} from '#test/store';
import {formatListener} from './formatMiddleware.ts';
import {
    editorBlur,
    transformBlur,
    setParseResult,
} from './reducers.ts';

function makeStore(overrides: StoreOverrides = {}) {
    return makeTestStore(overrides, {
        immutableCheck: false,
        middleware: [formatListener.middleware],
    }).store;
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

// ─── transformBlur ────────────────────────────────────────────────────────────
test('formatMiddleware: transformBlur with valid code formats transform', async (t) => {
    const store = makeStore({
        workbench: {
            transform: {
                code: 'export const replace=()=>({})',
                transformer: 'putout',
            },
        },
    });
    
    store.dispatch(transformBlur());
    await setImmediate();
    
    const {code} = store.getState().workbench.transform;
    
    t.equal(code, 'export const replace = () => ({});\n');
    t.end();
});

test('formatMiddleware: transformBlur with empty code does nothing', async (t) => {
    const store = makeStore({
        workbench: {
            transform: {
                code: '',
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
                transformer: 'putout',
            },
        },
    });
    
    store.dispatch(transformBlur());
    await setImmediate();
    
    t.equal(store.getState().workbench.transform.code, 'export const replace = () => ({});\n');
    t.end();
});

test('formatMiddleware: transformBlur inserts blank line after comment when missing', async (t) => {
    const store = makeStore({
        workbench: {
            transform: {
                code: '// https://git.io/JqcMn\nexport const report = () => `Use const`;',
                cursor: 0,
            },
        },
    });
    
    store.dispatch(transformBlur());
    await setImmediate();
    
    const {code} = store.getState().workbench.transform;
    const expected = montag`
        // https://git.io/JqcMn
        
        export const report = () => \`Use const\`;
   
   `;
    
    t.equal(code, expected);
    t.end();
});

test('formatMiddleware: transformBlur does not duplicate blank line when already present', async (t) => {
    const store = makeStore({
        workbench: {
            transform: {
                code: '// https://git.io/JqcMn\n\nexport const report = () => `Use const`;',
                cursor: 0,
            },
        },
    });
    
    store.dispatch(transformBlur());
    await setImmediate();
    
    const {code} = store.getState().workbench.transform;
    const expected = montag`
        // https://git.io/JqcMn
        
        export const report = () => \`Use const\`;
    
    `;
    
    t.equal(code, expected);
    t.end();
});

test('formatMiddleware: transformBlur sets format error when printer throws', async (t) => {
    const store = makeStore({
        workbench: {
            transform: {
                code: 'type A = number;',
                transformer: 'putout',
            },
        },
    });
    
    // @putout/printer does not support Flow: enable the Flow parser plugin
    // so the parsed node makes the printer crash, whatever its version is
    const list = plugins as string[];
    const flow = list.push('flow') - 1;
    
    store.dispatch(transformBlur());
    await setImmediate();
    
    list.splice(flow, 1);
    
    t.match(String(store.getState().formatError), 'not supported yet');
    t.end();
});

test('formatMiddleware: transformBlur does not set format error when rule cannot be parsed', async (t) => {
    const store = makeStore({
        workbench: {
            transform: {
                code: 'const = ;',
                transformer: 'putout',
            },
        },
    });
    
    store.dispatch(transformBlur());
    await setImmediate();
    
    const {formatError} = store.getState();
    
    t.notOk(formatError);
    t.end();
});

test('formatMiddleware: editorBlur sets format error when printer throws', async (t) => {
    const store = makeStore();
    const ast = {
        type: 'File',
        program: {
            type: 'Program',
            sourceType: 'module',
            body: [{
                type: 'UnknownNode',
            }],
            directives: [],
        },
    };
    
    store.dispatch(setParseResult({
        ast,
        treeAdapter: null,
        time: 0,
        source: 'x',
        error: null,
    } as never));
    store.dispatch(editorBlur());
    await setImmediate();
    
    const {formatError} = store.getState();
    
    t.ok(formatError);
    t.end();
});
