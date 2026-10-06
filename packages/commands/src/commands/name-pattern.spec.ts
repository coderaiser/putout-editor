import {test} from 'supertape';
import {runNamePattern} from './name-pattern.ts';

test('name-pattern: no snippet is an error', (t) => {
    const result = runNamePattern('');
    const expected = {
        type: 'error',
        message: 'No snippet. Put the snippet on the next line.',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('name-pattern: a snippet that does not parse is an error', (t) => {
    const result = runNamePattern('const = ;');
    const expected = {
        type: 'error',
        message: 'The snippet does not parse.',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('name-pattern: a declaration becomes a keyed declaration', (t) => {
    const result = runNamePattern('const add = 1;');
    const expected = {
        type: 'text',
        data: 'const __a = __b',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('name-pattern: an arrow function keeps its shape', (t) => {
    const result = runNamePattern('const add = (a, b) => a + b;');
    const expected = {
        type: 'text',
        data: 'const __a = (__b, __c) => __d + __e',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('name-pattern: a call keeps its shape and blanks the callee too', (t) => {
    const result = runNamePattern('f(a, b, c);');
    const expected = '__a(__b, __c, __d)';
    
    t.equal(result.type === 'text' && result.data, expected);
    t.end();
});
