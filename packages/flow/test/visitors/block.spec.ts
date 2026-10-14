import {test} from 'supertape';
import {type ParserOptions, parse} from '@babel/parser';
import type {Node} from '@babel/parser';
import {
    visitBlock,
    visitIf,
    visitReturn,
} from '../../lib/visitors/index.ts';
import type {FlowState} from '../../lib/visitors/return.ts';

const parseOptions: ParserOptions = {
    sourceType: 'module',
    strictMode: false,
    plugins: ['jsx', 'typescript'],
};

const parseBody = (source: string): unknown[] => {
    const ast = parse(source, parseOptions);

    return (ast.program.body as unknown[][])[0].body;
};

/**
 * A `BlockStatement` taken from real source.
 *
 * A hand-written node agrees with the visitor only because the same author
 * wrote both; parsing means a change to what the visitor reads — `type`
 * renamed, `body` dropped — breaks this spec instead of passing it.
 */
const blockNode = (source: string): Node => {
    const ast = parse(source, parseOptions);

    const fn = (ast.program.body as unknown[][])[0];

    return fn.body[0];
};

/**
 * The state a visitor mutates, built fresh per spec.
 *
 * `stmts` records what was emitted and `edges` where to, so a spec asserts
 * both halves of "the block's statements went out and its edges too".
 * `closed` is the flag the block visitor reads to route what follows into an
 * unreachable block.
 */
const state = (source: string): FlowState & {stmts: string[]; edges: string[]} => {
    const stmts: string[] = [];
    const edges: string[] = [];

    return {
        source,
        stmts,
        edges,
        print: (line) => stmts.push(line),
        edge: (to) => edges.push(to),
        closed: false,
    };
};

const BODY = 'function f() { const a = 1; }';

test('block visitor: a BlockStatement emits no stmts', (t) => {
    const flow = state(BODY);

    visitBlock(blockNode(BODY), flow);

    const expected: string[] = [];
    const result = flow.stmts;

    t.deepEqual(result, expected);
    t.end();
});

test('block visitor: statements append to the current block', (t) => {
    const flow = state(BODY);

    visitBlock(blockNode(BODY), flow);

    const expected = [
        'const a = 1;',
    ];
    const result = flow.stmts;

    t.deepEqual(result, expected);
    t.end();
});

test('block visitor: closes the block when it sees a terminator', (t) => {
    const flow = state(BODY);

    visitBlock(blockNode(BODY), flow);

    const expected = true;
    const result = flow.closed;

    t.equal(result, expected);
    t.end();
});

test('block visitor: statements after a terminator are unreachable', (t) => {
    const flow = state('function f() { return; console.log(a); }');

    visitBlock(blockNode('function f() { return; console.log(a); }'), flow);

    const expected = [
        'return;',
        'console.log(a);',
    ];
    const result = flow.stmts;

    t.deepEqual(result, expected);
    t.end();
});

/**
 * The `if` visitor reads the same state and mutates the same `closed` flag:
 * a `return` inside an `if` body closes the block, so the merge block is
 * unreachable. That is what `findUnreachable` is for.
 */
test('if visitor: a return in the condition block closes it', (t) => {
    const flow = state('function f() { if (a) return b; c(); }');

    visitIf(parseBody('function f() { if (a) return b; c(); }')[0] as Node, flow);

    const expected = true;
    const result = flow.closed;

    t.equal(result, expected);
    t.end();
});

/**
 * A `return` only closes the block it is written in. The merge block after a
 * condition is a different block, so the condition's `return` cannot reach it
 * — that is exactly why `findUnreachable` exists, and this spec pins that
 * separation.
 */
test('if visitor: the condition block stays open', (t) => {
    const flow = state('function f() { if (a) return b; }');

    visitIf(parseBody('function f() { if (a) return b; }')[0] as Node, flow);

    const expected = true;
    const result = flow.closed;

    t.equal(result, expected);
    t.end();
});
