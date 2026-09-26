import {test} from 'supertape';
import {tryCatch} from 'try-catch';
import {makeStore} from '#test/store';

const message = (overrides: unknown) => {
    const [error] = tryCatch(makeStore, overrides as never);
    
    return error?.message || 'no error thrown';
};

test('store: makeStore builds a store with no overrides', (t) => {
    const {store} = makeStore();
    const result = store.getState().workbench.code;
    
    t.ok(result);
    t.end();
});

test('store: makeStore accepts a source field in workbench', (t) => {
    const {store} = makeStore({
        workbench: {
            code: 'const a = 1;',
        },
    });
    
    const result = store.getState().workbench.code;
    
    t.equal(result, 'const a = 1;');
    t.end();
});

test('store: makeStore rejects workbench.initialCode', (t) => {
    const result = message({
        workbench: {
            initialCode: 'x',
        },
    });
    
    t.match(result, 'workbench.initialCode is derived by revive()');
    t.end();
});

test('store: makeStore rejects workbench.parserSettings', (t) => {
    const result = message({
        workbench: {
            parserSettings: {
                a: 1,
            },
        },
    });
    
    t.match(result, 'workbench.parserSettings is derived by revive()');
    t.end();
});

test('store: makeStore rejects workbench.transform.initialCode', (t) => {
    const result = message({
        workbench: {
            transform: {
                code: 'a',
                initialCode: '',
            },
        },
    });
    
    t.match(result, 'workbench.transform.initialCode is derived by revive()');
    t.end();
});

test('store: makeStore accepts workbench.transform.code', (t) => {
    const {store} = makeStore({
        workbench: {
            transform: {
                code: 'export const a = 1;',
            },
        },
    });
    
    const result = store.getState().workbench.transform.code;
    
    t.equal(result, 'export const a = 1;');
    t.end();
});

test('store: makeStore derives transform.initialCode from code', (t) => {
    const {store} = makeStore({
        workbench: {
            transform: {
                code: 'export const b = 2;',
            },
        },
    });
    
    const result = store.getState().workbench.transform.initialCode;
    
    t.equal(result, 'export const b = 2;');
    t.end();
});

test('store: makeStore accepts a top-level parserSettings map', (t) => {
    const {store} = makeStore({
        parserSettings: {
            babel: {
                range: true,
            },
        },
        workbench: {
            parser: 'babel',
        },
    });
    
    const result = store.getState().workbench.parserSettings;
    
    const expected = {
        range: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});
