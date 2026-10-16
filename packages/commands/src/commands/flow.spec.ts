import {test} from 'supertape';
import {runFlow} from './flow.ts';
import {parse} from '@putout/flow';

const noSource = ({
    source: '',
    plugin: '',
});

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

test('flow: no function body returns error', (t) => {
    const result = runFlow('', withSource('const a = 1;'));
    const expected = {
        type: 'error',
        message: 'No function body. Put the function on the next line.',
    };

    t.deepEqual(result, expected);
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
        t.end();
        return;
    }

    const roundTripped = parse(result.text);

    t.deepEqual(roundTripped, result.blocks);
    t.end();
});

test('flow: source travels with result', (t) => {
    const source = 'const a = 1;';
    const result = runFlow('function f() { return a; }', withSource(source));

    if (result.type !== 'flow') {
        t.fail('result is not a flow result');
        t.end();
        return;
    }

    const expected = source;

    t.equal(result.source, expected);
    t.end();
});
