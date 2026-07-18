import {test} from 'supertape';
import {
    getParser,
    getTransformer,
    canSave,
} from './parserSelectors.js';

const state = (overrides = {}) => ({
    activeRevision: null,
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
    showTransformPanel: false,
    ...overrides,
});

test('parserSelectors: getParser: returns parser by id', (t) => {
    t.equal(getParser(state()).id, 'babel');
    t.end();
});

test('parserSelectors: getTransformer: returns transformer by id', (t) => {
    t.equal(getTransformer(state()).id, 'putout');
    t.end();
});

test('parserSelectors: canSave: true when no revision (new snippet)', (t) => {
    const result = canSave(state());
    
    t.ok(result);
    t.end();
});

test('parserSelectors: canSave: true when code changed', (t) => {
    const result = canSave(state({
        workbench: {
            ...state().workbench,
            code: 'changed',
        },
    }));
    
    t.ok(result);
    t.end();
});

test('parserSelectors: canSave: true when no revision and code differs from initial', (t) => {
    const result = canSave(state({
        workbench: {
            ...state().workbench,
            code: 'a',
            initialCode: 'b',
        },
    }));
    
    t.ok(result);
    t.end();
});

test('parserSelectors: canSave: false when revision.canSave() is false', (t) => {
    const result = canSave(state({
        activeRevision: {
            canSave: () => false,
            getParserID: () => 'babel',
            getParserSettings: () => null,
        },
    }));
    
    t.notOk(result);
    t.end();
});

test('parserSelectors: canSave: true when transform code changed', (t) => {
    const result = canSave(state({
        showTransformPanel: true,
        workbench: {
            ...state().workbench,
            transform: {
                code: 'changed',
                initialCode: 'original',
                transformer: 'putout',
            },
        },
    }));
    
    t.ok(result);
    t.end();
});

test('parserSelectors: canSave: true when parser changed vs revision', (t) => {
    const result = canSave(state({
        activeRevision: {
            canSave: () => true,
            getParserID: () => 'espree',
            getParserSettings: () => null,
        },
    }));
    
    t.ok(result);
    t.end();
});

test('parserSelectors: canSave: true when parserSettings changed vs revision', (t) => {
    const result = canSave(state({
        activeRevision: {
            canSave: () => true,
            getParserID: () => 'babel',
            getParserSettings: () => ({
                plugins: ['flow'],
            }),
        },
        workbench: {
            ...state().workbench,
            parserSettings: {
                plugins: ['jsx'],
            },
        },
    }));
    
    t.ok(result);
    t.end();
});
