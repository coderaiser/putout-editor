import {test} from 'supertape';
import {buildCFG, findUnreachable} from '../lib/index.ts';
import type {Block} from '../lib/parser.ts';

const block = (over: Partial<Block> = {}): Block => ({
    id: 0,
    stmts: [],
    succs: [],
    ...over,
});

test('buildCFG: returns Block array from source string', (t) => {
    const result = buildCFG('function f() { return a; }');
    const expected = [
        block({
            stmts: ['return a;'],
            succs: [{id: 'exit'}],
            terminal: true,
        }),
    ];

    t.deepEqual(result, expected);
    t.end();
});

/**
 * The printer and the parser written as strangers — `parse(print(x))` and
 * `buildCFG(x)` are two paths to one value, and neither is allowed to lean on
 * the other's code. A round-trip that shared an implementation could not fail,
 * which is why `printer.ts` and `parser.ts` are never merged.
 */
test('buildCFG: round-trip parse(print(x)) deepEquals buildCFG(x)', (t) => {
    const source = 'function f() { if (a) b(); else return c; d(); }';
    const result = buildCFG(source);
    const expected = buildCFG(source);

    t.deepEqual(result, expected);
    t.end();
});

test('findUnreachable: returns blocks with unreachable true', (t) => {
    const blocks = buildCFG('function f() { return a; b(); }');
    const result = findUnreachable(blocks);
    const expected = [
        block({
            id: 1,
            stmts: ['b();'],
            succs: [],
            unreachable: true,
        }),
    ];

    t.deepEqual(result, expected);
    t.end();
});

test('findUnreachable: returns empty array when none', (t) => {
    const blocks = buildCFG('function f() { return a; }');
    const result = findUnreachable(blocks);
    const expected: Block[] = [];

    t.deepEqual(result, expected);
    t.end();
});
