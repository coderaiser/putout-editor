import {setImmediate} from 'node:timers/promises';
import {test} from 'supertape';
import {configureStore} from '@reduxjs/toolkit';
import {parserListener} from './parserMiddleware.js';
import {putoutEditor, setCode, setParserSettings} from './reducers.js';
import {getParserByID} from '../parsers/index.js';

const makeMockParseResult = () => ({
    type: 'Program',
    body: [],
    start: 0,
    end: 10,
    range: [0, 10],
    directives: [],
});

const getInitState = () => putoutEditor(undefined, {
    type: '@@INIT',
});

function makeStore(overrides = {}) {
    const state = getInitState();
    
    return configureStore({
        reducer: putoutEditor,
        preloadedState: overrides.workbench ? {
            ...state,
            workbench: {
                ...state.workbench,
                ...overrides.workbench,
            },
        } : state,
        middleware: (getDefault) => getDefault({
            immutableCheck: false,
            serializableCheck: false,
        }).prepend(parserListener.middleware),
    });
}

const getParseResult = (store) => store.getState().workbench.parseResult;

const stubBabel = ({
    parse = () => makeMockParseResult(),
    opensByDefault,
    promise = Promise.resolve({
        parse: () => makeMockParseResult(),
    }),
} = {}) => {
    const babel = getParserByID('babel');
    const originalPromise = babel._promise;
    const originalParse = babel.parse;
    const originalOpens = babel.opensByDefault;
    
    babel._promise = promise;
    babel.parse = parse;
    babel.opensByDefault = opensByDefault;
    
    return {
        restore() {
            babel._promise = originalPromise;
            babel.parse = originalParse;
            babel.opensByDefault = originalOpens;
        },
    };
};

test('parserMiddleware: INIT triggers parse and sets parseResult ast', async (t) => {
    const stub = stubBabel();
    const store = makeStore();
    
    store.dispatch({
        type: 'INIT',
    });
    await setImmediate();
    await setImmediate();
    
    stub.restore();
    
    t.ok(getParseResult(store).ast);
    t.end();
});

test('parserMiddleware: code change triggers parse', async (t) => {
    const stub = stubBabel();
    const store = makeStore();
    
    store.dispatch(setCode({
        code: 'const y = 2',
        cursor: 0,
    }));
    await setImmediate();
    await setImmediate();
    
    stub.restore();
    
    t.ok(getParseResult(store).ast);
    t.end();
});

test('parserMiddleware: parse error sets parseResult error', async (t) => {
    const stub = stubBabel({
        parse: () => {
            throw Error('parse failed');
        },
    });
    const store = makeStore();
    
    store.dispatch({
        type: 'INIT',
    });
    await setImmediate();
    await setImmediate();
    
    stub.restore();
    
    t.ok(getParseResult(store).error);
    t.end();
});

test('parserMiddleware: no change skips parse', async (t) => {
    const stub = stubBabel();
    const store = makeStore({
        workbench: {
            parseResult: {
                ast: {
                    type: 'Program',
                },
                time: 5,
                error: null,
                treeAdapter: {},
            },
        },
    });
    
    store.dispatch({
        type: 'UNKNOWN',
    });
    await setImmediate();
    await setImmediate();
    
    stub.restore();
    
    t.equal(getParseResult(store).time, 5);
    t.end();
});

test('parserMiddleware: null parser skips parse', async (t) => {
    const stub = stubBabel();
    const store = makeStore({
        workbench: {
            parser: 'unknown-parser',
        },
    });
    
    store.dispatch({
        type: 'INIT',
    });
    await setImmediate();
    await setImmediate();
    
    stub.restore();
    
    t.notOk(getParseResult(store));
    t.end();
});

test('parserMiddleware: null code skips parse', async (t) => {
    const stub = stubBabel();
    const store = makeStore({
        workbench: {
            code: null,
        },
    });
    
    store.dispatch({
        type: 'INIT',
    });
    await setImmediate();
    await setImmediate();
    
    stub.restore();
    
    t.notOk(getParseResult(store));
    t.end();
});

test('parserMiddleware: parse with settings filters import attributes', async (t) => {
    const stub = stubBabel();
    const store = makeStore({
        workbench: {
            parserSettings: {
                plugins: [
                    'jsx',
                    'importAssertions',
                    ['importAttributes', {}],
                ],
            },
        },
    });
    
    store.dispatch({
        type: 'INIT',
    });
    await setImmediate();
    await setImmediate();
    
    stub.restore();
    
    t.ok(getParseResult(store).ast);
    t.end();
});

test('parserMiddleware: code change during parse discards stale result', async (t) => {
    let resolveParse;
    const promise = new Promise((r) => {
        resolveParse = r;
    });
    let parsedCodes = [];
    
    const stub = stubBabel({
        promise,
        parse: (_realParser, code) => {
            parsedCodes.push(code);
            return makeMockParseResult();
        },
    });
    const store = makeStore();
    
    store.dispatch({
        type: 'INIT',
    });
    store.dispatch(setCode({
        code: 'const y = 2',
        cursor: 0,
    }));
    resolveParse({
        parse: () => ({
            type: 'Program',
            body: [],
        }),
    });
    await setImmediate();
    await setImmediate();
    
    stub.restore();
    
    t.notOk(getParseResult(store).stale);
    t.end();
});

test('parserMiddleware: parser settings change during parse discards stale result', async (t) => {
    let resolveParse;
    const promise = new Promise((r) => {
        resolveParse = r;
    });
    
    const stub = stubBabel({
        promise,
    });
    const store = makeStore();
    
    store.dispatch({
        type: 'INIT',
    });
    store.dispatch(setParserSettings({
        plugins: ['jsx'],
    }));
    resolveParse({
        parse: () => ({
            type: 'Program',
            body: [],
        }),
    });
    await setImmediate();
    await setImmediate();
    
    stub.restore();
    
    t.notOk(getParseResult(store).stale);
    t.end();
});

test('parserMiddleware: parse with fresh _promise', async (t) => {
    const babel = getParserByID('babel');
    const originalPromise = babel._promise;
    const originalParse = babel.parse;
    const originalLoad = babel.loadParser;
    
    babel._promise = undefined;
    babel.parse = () => makeMockParseResult();
    babel.loadParser = (cb) => cb({
        parse: () => makeMockParseResult(),
    });
    
    const store = makeStore();
    
    store.dispatch({
        type: 'INIT',
    });
    await setImmediate();
    await setImmediate();
    
    babel._promise = originalPromise;
    babel.parse = originalParse;
    babel.loadParser = originalLoad;
    
    t.ok(getParseResult(store).ast);
    t.end();
});

test('parserMiddleware: parser with falsy opensByDefault', async (t) => {
    const stub = stubBabel({
        opensByDefault: false,
    });
    const store = makeStore();
    
    store.dispatch({
        type: 'INIT',
    });
    await setImmediate();
    await setImmediate();
    
    stub.restore();
    
    t.ok(getParseResult(store).ast);
    t.end();
});

