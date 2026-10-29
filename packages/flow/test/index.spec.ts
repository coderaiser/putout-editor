import {test} from 'supertape';
import {
    buildCFG,
    findUnreachable,
} from '../lib/index.ts';
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
            succs: [{
                id: 'exit',
            }],
            terminal: true,
        }),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * A guard clause: `return 2;` runs whenever `x` is false, so it is reachable.
 * This is the shape `remove-unreachable-code` would act on, and the one the
 * `if` visitor used to mark `[unreachable]` — the false edge into block 2 was
 * drawn and the block was dead anyway.
 */
test('buildCFG: code after a guard clause is reachable', (t) => {
    const result = buildCFG('function f(x) { if (x) return 1; return 2; }');
    
    const expected = [
        block({
            stmts: ['x ?'],
            succs: [{
                id: 1,
                label: 'true',
            }, {
                id: 2,
                label: 'false',
            }],
        }),
        block({
            id: 1,
            stmts: ['return 1;'],
            succs: [{
                id: 'exit',
            }],
            terminal: true,
        }),
        block({
            id: 2,
            stmts: ['return 2;'],
            succs: [{
                id: 'exit',
            }],
            terminal: true,
        }),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('findUnreachable: a guard clause leaves nothing unreachable', (t) => {
    const blocks = buildCFG('function f(x) { if (x) return 1; return 2; }');
    const result = findUnreachable(blocks);
    const expected: Block[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('buildCFG: a braced then arm walks its block', (t) => {
    const result = buildCFG('function f(x) { if (x) { a(); } b(); }');
    
    const expected = [
        block({
            stmts: ['x ?'],
            succs: [{
                id: 1,
                label: 'true',
            }, {
                id: 2,
                label: 'false',
            }],
        }),
        block({
            id: 1,
            stmts: ['a();'],
            succs: [{
                id: 2,
            }],
        }),
        block({
            id: 2,
            stmts: ['b();'],
            succs: [{
                id: 'exit',
            }],
        }),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('buildCFG: both arms returning leaves the join unreachable', (t) => {
    const blocks = buildCFG('function f(x) { if (x) return 1; else return 2; }');
    const result = findUnreachable(blocks).map(({id}) => id);
    const expected = [3];
    
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
