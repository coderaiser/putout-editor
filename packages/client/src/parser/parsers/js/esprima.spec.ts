import {test} from 'supertape';
import esprimaParser from './esprima.ts';

const code = 'const hello = world(1);';

const load = () => new Promise((resolve) => {
    esprimaParser.loadParser(resolve);
});

test('esprima: loadParser resolves a module that can parse', async (t) => {
    const esprima = await load();
    const result = typeof (esprima as {
        parse?: unknown;
    }).parse;
    
    const expected = 'function';
    
    t.equal(result, expected);
    t.end();
});

test('esprima: parse returns a Program', async (t) => {
    const esprima = await load();
    const ast = esprimaParser.parse(esprima, code, esprimaParser.getDefaultOptions());
    
    const result = (ast as {type: string}).type;
    
    const expected = 'Program';
    
    t.equal(result, expected);
    t.end();
});

test('esprima: forEachProperty yields every non-function property', (t) => {
    const node = {
        type: 'Identifier',
        name: 'hello',
        loc: {
            start: 0,
        },
        // a function property has to be skipped, or the tree walker would
        // recurse into it
        walk() {},
    };
    const result: string[] = [];
    
    for (const {key} of esprimaParser.forEachProperty(node))
        result.push(key);
    
    const expected = [
        'type',
        'name',
        'loc',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('esprima: forEachProperty reports the value, key and computed flag', (t) => {
    const result = [...esprimaParser.forEachProperty({
        type: 'Identifier',
    })];
    const expected = [{
        value: 'Identifier',
        key: 'type',
        computed: false,
    }];
    
    t.deepEqual(result, expected);
    t.end();
});

test('esprima: getDefaultOptions parses modules with ranges', (t) => {
    const result = esprimaParser.getDefaultOptions();
    const expected = {
        sourceType: 'module',
        loc: true,
        tokens: false,
        comment: false,
        attachComment: false,
        tolerant: false,
        jsx: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('esprima: settings require range', (t) => {
    const config = esprimaParser._getSettingsConfiguration();
    const result = config.required.has('range');
    
    t.ok(result);
    t.end();
});
