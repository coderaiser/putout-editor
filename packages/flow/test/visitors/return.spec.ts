import {test} from 'supertape';
import {type ParserOptions, parse} from '@babel/parser';
import {visitReturn, type FlowState} from '../../lib/visitors/return.ts';

const parseOptions: ParserOptions = {
    sourceType: 'module',
    strictMode: false,
    plugins: ['jsx', 'typescript'],
};

/**
 * The `ReturnStatement` inside `function f() { … }`, taken from real source
 * rather than hand-built.
 *
 * A hand-written node agrees with the visitor only because the same author wrote
 * both; parsing `return a;` means a change to what the visitor reads —
 * `argument` renamed, `type` changed — breaks this spec instead of passing it.
 * The two hops are the function and its body, so the node is the same shape the
 * printer's traversal hands over.
 */
const returnNode = (source: string) => {
    const ast = parse(source, parseOptions) as {program: {body: {body: {body: unknown[]}}[]}};

    const fn = (ast.program.body as [{body: {body: [{type: string}]}}])[0];

    return fn.body.body[0];
};

/**
 * The state a visitor mutates, built fresh per spec.
 *
 * `stmts` records what was emitted and `edges` records where to, so a spec can
 * assert both halves of "the return went to exit and its argument came first"
 * without reaching into a printer. `closed` is the flag the printer reads to
 * know the block cannot take more statements.
 *
 * `source` is the text the node was parsed from — the visitor slices statements
 * out of it, which is what keeps `stmts` as source strings rather than a
 * re-print of the AST.
 */
const state = (source: string): FlowState & {stmts: string[]; edges: string[]} => {
    const stmts: string[] = [];
    const edges: string[] = [];

    return {
        source,
        stmts,
        edges,
        print: (line: string) => stmts.push(line),
        edge: (to: string) => edges.push(to),
        closed: false,
    };
};

const RETURN = 'function f() { return a; }';
const BARE = 'function f() { return; }';

test('return visitor: emits exit edge', (t) => {
    const flow = state(RETURN);

    visitReturn(returnNode(RETURN), flow);

    const expected = ['exit'];
    const result = flow.edges;

    t.deepEqual(result, expected);
    t.end();
});

test('return visitor: argument printed as stmt before edge', (t) => {
    const flow = state(RETURN);

    visitReturn(returnNode(RETURN), flow);

    const expected = [
        'return a;',
        'exit',
    ];
    const result = [
        ...flow.stmts,
        ...flow.edges,
    ];

    t.deepEqual(result, expected);
    t.end();
});

/**
 * The statement is the **source text**, not a re-print of the node — semicolon,
 * odd spacing and all.
 *
 * `stmts` are what a reader compares against the editor, so a block holding
 * `return   "a"  ;` must show that and not a tidied version of it. Slicing by
 * `start`/`end` is what guarantees it, and this spec is what stops it being
 * replaced by a generator later — the difference is invisible on `return a` and
 * immediate on anything with unusual whitespace.
 */
test('return visitor: the statement is sliced from the source verbatim', (t) => {
    const odd = 'function f() { return   "a"  ; }';
    const flow = state(odd);

    visitReturn(returnNode(odd), flow);

    const expected = ['return   "a"  ;'];
    const result = flow.stmts;

    t.deepEqual(result, expected);
    t.end();
});

/**
 * A bare `return;` prints no statement, and that is not the same as an empty
 * one.
 *
 * `return;` and `return undefined;` are different nodes — the first has no
 * `argument` at all — and printing `return undefined` for it would put a
 * statement in the block the source does not have, which is exactly the drift
 * `stmts` being source strings exists to prevent.
 */
test('return visitor: a bare return prints no statement', (t) => {
    const flow = state(BARE);

    visitReturn(returnNode(BARE), flow);

    const expected: string[] = [];
    const result = flow.stmts;

    t.deepEqual(result, expected);
    t.end();
});

/**
 * The block is closed, which is what makes the next statement unreachable.
 *
 * This is the half of the visitor that is not about this node: `closed` is read
 * by the block visitor, which routes anything after a terminator into a block
 * the printer marks `[unreachable]`. Without it, `return a; console.log(a);`
 * would draw as one reachable block and the graph would claim the log runs.
 */
test('return visitor: closes the block so what follows is unreachable', (t) => {
    const flow = state(RETURN);

    visitReturn(returnNode(RETURN), flow);

    const expected = true;
    const result = flow.closed;

    t.equal(result, expected);
    t.end();
});
