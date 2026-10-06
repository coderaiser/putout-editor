import {test} from 'supertape';
import {runTestPattern} from './test-pattern.ts';

const withSource = (source: string) => ({
    source,
    plugin: '',
});

test('test-pattern: no source is an error', async (t) => {
    const result = await runTestPattern('const __a = __b', withSource(''));
    const expected = {
        type: 'error',
        message: 'No source. Use source first.',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('test-pattern: no key is an error', async (t) => {
    const result = await runTestPattern('', withSource('const a = 1;'));
    const expected = {
        type: 'error',
        message: 'No pattern key. Put the key on the next line.',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('test-pattern: a matching key reports one match', async (t) => {
    const result = await runTestPattern('const __a = __b', withSource('const a = 1;'));
    const expected = '1 match';
    
    t.equal(result.type === 'text' && result.data.split('\n')[0], expected);
    t.end();
});

test('test-pattern: a matching key reports what __a bound to', async (t) => {
    const result = await runTestPattern('const __a = __b', withSource('const a = 1;'));
    const expected = '__a → a';
    
    t.ok(result.type === 'text' && result.data.includes(expected));
    t.end();
});

test('test-pattern: a key matching nothing says so', async (t) => {
    const result = await runTestPattern('f(__a)', withSource('const a = 1;'));
    const expected = 'Nothing matched. A placeholder only takes a type from the shape around it, so "f(__a)" matches a call.';
    
    t.equal(result.type === 'text' && result.data, expected);
    t.end();
});

test('test-pattern: a key whose placeholder is not a single letter matches nothing', async (t) => {
    const result = await runTestPattern('const __abc = __b', withSource('const a = 1;'));
    const expected = 'Nothing matched. A placeholder only takes a type from the shape around it, so "f(__a)" matches a call.';
    
    t.equal(result.type === 'text' && result.data, expected);
    t.end();
});

test('test-pattern: several matches are counted in the plural', async (t) => {
    const result = await runTestPattern('var __a = __b', withSource('var x = 1;\nvar y = 2;'));
    const expected = '2 matches';
    
    t.equal(result.type === 'text' && result.data.split('\n')[0], expected);
    t.end();
});

test('test-pattern: a bad key is an error', async (t) => {
    const result = await runTestPattern('!!!', withSource('const a = 1;'));
    const expected = 'error';
    
    t.equal(result.type, expected);
    t.end();
});
