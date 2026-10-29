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

test('flow: the graphed body travels with result', (t) => {
    const body = 'function f() { return a; }';
    const result = runFlow(body, withSource('const a = 1;'));
    
    if (result.type !== 'flow') {
        t.fail('result is not a flow result');
    } else {
        const expected = body;
        
        t.equal(result.source, expected);
    }
    
    t.end();
});

test('flow: a body that does not parse is an error, not an empty graph', (t) => {
    const result = runFlow('function (', withSource('function f() {}'));
    
    t.equal(result.type, 'error');
    t.end();
});

test('flow: text marks unreachable blocks and labels conditional edges', (t) => {
    const source = 'function f(x) { return 1; if (x) return 2; }';
    const result = runFlow('', withSource(source));
    
    const text = result.type === 'flow' ? result.text : '';
    
    t.ok(text.includes('[unreachable]') && text.includes('[true]'));
    t.end();
});
