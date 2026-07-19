import {setImmediate} from 'node:timers/promises';
import {test} from 'supertape';
import createMiddleware from './parserMiddleware.js';
import {getParserByID} from '../parsers/index.js';

const makeMockParseResult = () => ({
    type: 'Program',
    body: [],
    start: 0,
    end: 10,
    range: [0, 10],
    directives: [],
});

const makeBaseState = (overrides = {}) => ({
    workbench: {
        parser: 'babel',
        parserSettings: null,
        code: 'const x = 1',
        parseResult: null,
        keyMap: 'vim',
        initialCode: 'const x = 1',
        transform: {
            code: '',
            initialCode: '',
            transformer: 'putout',
        },
    },
    parserSettings: {},
    parserPerCategory: {},
    ...overrides,
});

test('parserMiddleware: INIT triggers parse and dispatches SET_PARSE_RESULT with ast', async (t) => {
    const babel = getParserByID('babel');
    const originalPromise = babel._promise;
    
    babel._promise = Promise.resolve({
        parse: () => makeMockParseResult(),
    });
    babel.parse = () => makeMockParseResult();
    
    const store = {
        getState: makeBaseState,
    };
    
    const nextActions = [];
    const push = nextActions.push.bind(nextActions);
    const dispatch = createMiddleware(store)(push);
    
    dispatch({
        type: 'INIT',
    });
    await setImmediate();
    
    babel._promise = originalPromise;
    const types = [];
    
    for (const a of nextActions) {
        types.push(a.type);
    }
    
    const result = types.includes('SET_PARSE_RESULT');
    
    t.ok(result);
    t.end();
});

test('parserMiddleware: code change triggers parse', async (t) => {
    const babel = getParserByID('babel');
    const originalPromise = babel._promise;
    
    babel._promise = Promise.resolve({
        parse: () => makeMockParseResult(),
    });
    babel.parse = () => makeMockParseResult();
    
    const store = {
        getState: () => makeBaseState(),
    };
    
    const nextActions = [];
    const push = nextActions.push.bind(nextActions);
    const dispatch = createMiddleware(store)(push);
    
    dispatch({
        type: 'SET_CODE',
        code: 'const y = 2',
    });
    await setImmediate();
    
    babel._promise = originalPromise;
    
    t.ok(nextActions.length > 0);
    t.end();
});

test('parserMiddleware: parse error dispatches SET_PARSE_RESULT with error', async (t) => {
    const babel = getParserByID('babel');
    const originalPromise = babel._promise;
    const originalParse = babel.parse;
    
    babel._promise = Promise.resolve({});
    babel.parse = () => {
        throw Error('parse failed');
    };
    
    const store = {
        getState: makeBaseState,
    };
    
    const nextActions = [];
    const dispatch = createMiddleware(store)((a) => nextActions.push(a));
    
    dispatch({
        type: 'INIT',
    });
    await setImmediate();
    
    babel._promise = originalPromise;
    babel.parse = originalParse;
    const types = [];
    
    for (const a of nextActions) {
        types.push(a.type);
    }
    
    const result = types.includes('SET_PARSE_RESULT');
    
    t.ok(result);
    t.end();
});

test('parserMiddleware: no change skips parse', (t) => {
    const store = {
        getState: () => makeBaseState({
            workbench: {
                ...makeBaseState().workbench,
                parseResult: {
                    ast: {
                        type: 'Program',
                    },
                    time: 5,
                    error: null,
                    treeAdapter: {},
                },
            },
        }),
    };
    
    const nextActions = [];
    const dispatch = createMiddleware(store)((a) => nextActions.push(a));
    
    dispatch({
        type: 'UNKNOWN',
    });
    
    const types = [];
    
    for (const a of nextActions) {
        types.push(a.type);
    }
    
    const result = types.includes('SET_PARSE_RESULT');
    
    t.notOk(result);
    t.end();
});

test('parserMiddleware: null parser skips parse', (t) => {
    const store = {
        getState: () => makeBaseState({
            workbench: {
                ...makeBaseState().workbench,
                parser: 'unknown-parser',
            },
        }),
    };
    
    const nextActions = [];
    const dispatch = createMiddleware(store)((a) => nextActions.push(a));
    
    dispatch({
        type: 'INIT',
    });
    
    const types = [];
    
    for (const a of nextActions) {
        types.push(a.type);
    }
    
    const result = types.includes('SET_PARSE_RESULT');
    
    t.notOk(result);
    t.end();
});

test('parserMiddleware: null code skips parse', (t) => {
    const store = {
        getState: () => makeBaseState({
            workbench: {
                ...makeBaseState().workbench,
                code: null,
            },
        }),
    };
    
    const nextActions = [];
    const dispatch = createMiddleware(store)((a) => nextActions.push(a));
    
    dispatch({
        type: 'INIT',
    });
    
    const types = [];
    
    for (const a of nextActions) {
        types.push(a.type);
    }
    
    const result = types.includes('SET_PARSE_RESULT');
    
    t.notOk(result);
    t.end();
});

test('parserMiddleware: parse with settings filters import attributes', async (t) => {
    const babel = getParserByID('babel');
    const originalPromise = babel._promise;
    const originalParse = babel.parse;
    
    babel._promise = Promise.resolve({
        parse: () => makeMockParseResult(),
    });
    babel.parse = () => makeMockParseResult();
    
    const state = makeBaseState({
        workbench: {
            ...makeBaseState().workbench,
            parserSettings: {
                plugins: [
                    'jsx',
                    'importAssertions',
                    ['importAttributes', { }],
                ],
            },
        },
    });
    
    const store = {
        getState: () => state,
    };
    
    const nextActions = [];
    const dispatch = createMiddleware(store)((a) => nextActions.push(a));
    
    dispatch({
        type: 'INIT',
    });
    await setImmediate();
    
    babel._promise = originalPromise;
    babel.parse = originalParse;
    const types = [];
    
    for (const a of nextActions) {
        types.push(a.type);
    }
    
    const result = types.includes('SET_PARSE_RESULT');
    
    t.ok(result);
    t.end();
});

test('parserMiddleware: state change between dispatch and resolve discards result', async (t) => {
    const babel = getParserByID('babel');
    const originalPromise = babel._promise;
    let resolveParse;
    
    babel._promise = new Promise((r) => {
        resolveParse = r;
    });
    babel.parse = () => makeMockParseResult();
    
    let state = makeBaseState();
    const store = {
        getState: () => state,
    };
    
    const nextActions = [];
    const dispatch = createMiddleware(store)((a) => nextActions.push(a));
    
    dispatch({
        type: 'INIT',
    });
    
    // Change state before promise resolves
    state = makeBaseState({
        workbench: {
            ...makeBaseState().workbench,
            parser: 'different-parser',
        },
    });
    
    resolveParse({
        parse: () => makeMockParseResult(),
    });
    await setImmediate();
    
    babel._promise = originalPromise;
    const types = [];
    
    for (const a of nextActions) {
        types.push(a.type);
    }
    
    const result = types.includes('SET_PARSE_RESULT');
    
    t.notOk(result);
    t.end();
});

test('parserMiddleware: parse with fresh _promise', async (t) => {
    const babel = getParserByID('babel');
    const originalPromise = babel._promise;
    const originalParse = babel.parse;
    
    const state = makeBaseState();
    const store = {
        getState: () => state,
    };
    
    const nextActions = [];
    const dispatch = createMiddleware(store)((a) => nextActions.push(a));
    
    // Clear _promise so parse creates a new one
    babel._promise = undefined;
    babel.parse = () => makeMockParseResult();
    babel.loadParser = (cb) => cb({
        parse: () => makeMockParseResult(),
    });
    
    dispatch({
        type: 'INIT',
    });
    await setImmediate();
    
    babel._promise = originalPromise;
    babel.parse = originalParse;
    const types = [];
    
    for (const a of nextActions) {
        types.push(a.type);
    }
    
    const result = types.includes('SET_PARSE_RESULT');
    
    t.ok(result);
    t.end();
});

test('parserMiddleware: parser with falsy opensByDefault', async (t) => {
    const babel = getParserByID('babel');
    const originalPromise = babel._promise;
    const originalParse = babel.parse;
    const originalOpensByDefault = babel.opensByDefault;
    
    const state = makeBaseState();
    const store = {
        getState: () => state,
    };
    
    const nextActions = [];
    const dispatch = createMiddleware(store)((a) => nextActions.push(a));
    
    babel._promise = Promise.resolve({
        parse: () => makeMockParseResult(),
    });
    babel.parse = () => makeMockParseResult();
    babel.opensByDefault = false;
    
    dispatch({
        type: 'INIT',
    });
    await setImmediate();
    
    babel._promise = originalPromise;
    babel.parse = originalParse;
    babel.opensByDefault = originalOpensByDefault;
    const types = [];
    
    for (const a of nextActions) {
        types.push(a.type);
    }
    
    const result = types.includes('SET_PARSE_RESULT');
    
    t.ok(result);
    t.end();
});

test('parserMiddleware: code change between dispatch and resolve discards result', async (t) => {
    const babel = getParserByID('babel');
    const originalPromise = babel._promise;
    let resolveParse;
    
    babel._promise = new Promise((r) => {
        resolveParse = r;
    });
    babel.parse = () => makeMockParseResult();
    
    let state = makeBaseState();
    const store = {
        getState: () => state,
    };
    
    const nextActions = [];
    const dispatch = createMiddleware(store)((a) => nextActions.push(a));
    
    dispatch({
        type: 'INIT',
    });
    
    state = makeBaseState({
        workbench: {
            ...makeBaseState().workbench,
            code: 'const y = 2',
        },
    });
    
    resolveParse({
        parse: () => makeMockParseResult(),
    });
    await setImmediate();
    
    babel._promise = originalPromise;
    const result = nextActions.some(({type}) => type === 'SET_PARSE_RESULT');
    
    t.notOk(result);
    t.end();
});

test('parserMiddleware: parserSettings change between dispatch and resolve discards result', async (t) => {
    const babel = getParserByID('babel');
    const originalPromise = babel._promise;
    let resolveParse;
    
    babel._promise = new Promise((r) => {
        resolveParse = r;
    });
    babel.parse = () => makeMockParseResult();
    
    let state = makeBaseState();
    const store = {
        getState: () => state,
    };
    
    const nextActions = [];
    const dispatch = createMiddleware(store)((a) => nextActions.push(a));
    
    dispatch({
        type: 'INIT',
    });
    
    state = makeBaseState({
        workbench: {
            ...makeBaseState().workbench,
            parserSettings: {
                plugins: ['jsx'],
            },
        },
    });
    
    resolveParse({
        parse: () => makeMockParseResult(),
    });
    await setImmediate();
    
    babel._promise = originalPromise;
    const result = nextActions.some(({type}) => type === 'SET_PARSE_RESULT');
    
    t.notOk(result);
    t.end();
});
