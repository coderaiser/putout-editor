import {test} from 'supertape';
import {parse} from '@putout/flow';
import {runFlow} from './flow.ts';

const noSource = {
    source: '',
    plugin: '',
};

const withSource = (source: string) => ({
    source,
    plugin: '',
});

test('flow: no source returns error', (t) => {
    const result = runFlow('function f() { return a; }', noSource);
    const expected = {
        type: 'error',
        message: 'No source. Use source first.',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('flow: no args uses source as body', (t) => {
    const source = 'function f() { return a; }';
    const result = runFlow('', withSource(source));
    const expected = 'flow';
    
    t.equal(result.type, expected);
    t.end();
});

test('flow: empty args with source produces flow', (t) => {
    const result = runFlow('', withSource('function f() { return a; }'));
    const expected = 'flow';
    
    t.equal(result.type, expected);
    t.end();
});

test('flow: valid source returns type flow', (t) => {
    const result = runFlow('function f() { return a; }', withSource('const a = 1;'));
    const expected = 'flow';
    
    t.equal(result.type, expected);
    t.end();
});

test('flow: text round-trips — parse(result.text) deepEquals result.blocks', (t) => {
    const source = 'function f() { return a; }';
    const result = runFlow(source, withSource(source));
    
    if (result.type !== 'flow') {
        t.fail('result is not a flow result');
    } else {
        const roundTripped = parse(result.text);
        
        t.deepEqual(roundTripped, result.blocks);
    }
    
    t.end();
});

test('flow: source travels with result', (t) => {
    const source = 'const a = 1;';
    const result = runFlow('function f() { return a; }', withSource(source));
    
    if (result.type !== 'flow') {
        t.fail('result is not a flow result');
    } else {
        const expected = source;
        
        t.equal(result.source, expected);
    }
    
    t.end();
});
