import {test} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
} from './namer.ts';

const call = async (fixture: string) => JSON.parse((await handler({
    fixture,
})).content[0].text);

const keys = (out: {named: {key: string}[]}) => {
    const names = [];
    
    for (const {key} of out.named)
        names.push(key);
    
    return names;
};

const genericKeys = (out: {generic: {key: string}[]}) => {
    const names = [];
    
    for (const {key} of out.generic)
        names.push(key);
    
    return names;
};

test('local name-pattern: name is name_pattern', (t) => {
    const result = name;
    const expected = 'name_pattern';
    
    t.equal(result, expected);
    t.end();
});

test('local name-pattern: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('local name-pattern: schema has fixture', (t) => {
    const result = Object.keys(schema.shape);
    const expected = ['fixture'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local name-pattern: an array is named __array', async (t) => {
    const result = keys(await call('[1, 2, 3];'));
    const expected = ['__array'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local name-pattern: a parenthesised object is named __object', async (t) => {
    const result = keys(await call('({a: 1});'));
    const expected = ['__object'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local name-pattern: a bare object literal is a block, not __object', async (t) => {
    const result = (await call('{a: 1};')).named;
    const expected: unknown[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local name-pattern: a call names __args and the generic values', async (t) => {
    const result = genericKeys(await call('f(1, 2);'));
    const expected = [
        '__a',
        '__',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local name-pattern: a declaration is generalised', async (t) => {
    const result = (await call('const x = 1;')).key.key;
    const expected = 'const __a = __b';
    
    t.equal(result, expected);
    t.end();
});

test('local name-pattern: a call is generalised with one name per argument', async (t) => {
    const result = (await call('f(1, 2);')).key.key;
    const expected = '__a(__b, __c)';
    
    t.equal(result, expected);
    t.end();
});

test('local name-pattern: a proposed key is only reported when it matched', async (t) => {
    const {key} = await call('const x = 1;');
    const result = key.matched;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('local name-pattern: a shape with no generalisation says so', async (t) => {
    const out = await call('import x from "y";');
    const result = typeof out.key_hint;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('local name-pattern: nothing matched carries a hint', async (t) => {
    const out = await call('1 +');
    const result = typeof out.hint;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});
