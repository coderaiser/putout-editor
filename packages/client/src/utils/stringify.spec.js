import {test} from 'supertape';
import stringify from './stringify.js';

test('stringify: function returns signature', (t) => {
    const result = stringify(function example(a, b) {});
    
    t.equal(result, 'function example(a, b)');
    t.end();
});

test('stringify: object', (t) => {
    const result = stringify({a: 1});
    
    t.equal(result, String.raw`"\"\""`);
    t.end();
});

test('stringify: null', (t) => {
    const result = stringify(null);
    
    t.equal(result, 'null');
    t.end();
});

test('stringify: undefined', (t) => {
    const result = stringify(undefined);
    
    t.equal(result, 'undefined');
    t.end();
});

test('stringify: NaN', (t) => {
    const result = stringify(NaN);
    
    t.equal(result, 'NaN');
    t.end();
});

test('stringify: number', (t) => {
    const result = stringify(42);
    
    t.equal(result, 42);
    t.end();
});

test('stringify: string falls to default case', (t) => {
    const result = stringify('hi');
    
    t.equal(result, '"hi"');
    t.end();
});
