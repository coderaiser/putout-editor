import {test} from 'supertape';
import {type ParserOptions, parse} from '@babel/parser';
import type {Node} from '@babel/types';
import {visitReturn} from '../../lib/visitors/return.ts';
import type {FlowApi} from '../../lib/visitors/api.types.ts';

const noop = () => {};

const parseOptions: ParserOptions = {
    sourceType: 'module',
    strictMode: false,
    plugins: ['jsx', 'typescript'],
};

/**
 * The `ReturnStatement` inside `function f() { … }`, taken from real source
 * rather than hand-built.
 *
 * A hand-written node agrees with the visitor only because the same author
 * wrote both; parsing `return a;` means a change to what the visitor reads —
 * `argument` renamed, `type` changed — breaks this spec instead of passing it.
 * The two hops are the function and its body, so the node is the same shape
 * the printer's traversal hands over.
 */
const returnNode = (source: string): Node => {
    const ast = parse(source, parseOptions);
    const fn = ast.program.body[0] as unknown as {
        body: {
            body: Node[];
        };
    };
    
    return fn.body.body[0];
};

interface Recorded {
    stmts: string[];
    edges: string[];
    api: FlowApi;
}

/**
 * The printer half of the `FlowApi` contract, recorded instead of executed.
 *
 * Only `print` and `edge` record — the plan's `return` cases are all about
 * what was emitted, in order. Every other method is present because the type
 * demands it and does nothing, which the suite never asserts on: a stub that
 * answered `terminated() === true` would be asserting the printer's half of
 * the contract from the visitor's spec.
 */
const api = (source: string): Recorded => {
    const stmts: string[] = [];
    const edges: string[] = [];
    
    const self: FlowApi = {
        source,
        print: (line) => {
            stmts.push(line);
        },
        currentBlock: () => 0,
        edge: (to) => {
            edges.push(String(to));
        },
        edgeFrom: noop,
        terminated: () => false,
        walk: noop,
        branch: () => 0,
        merge: () => 0,
        mergeUnreachable: () => 0,
        closed: () => false,
        unreachable: () => 0,
    };
    
    return {
        stmts,
        edges,
        api: self,
    };
};

const RETURN = 'function f() { return a; }';
const BARE = 'function f() { return; }';

test('return visitor: emits exit edge', (t) => {
    const recorded = api(RETURN);
    
    visitReturn(returnNode(RETURN), recorded.api);
    
    const result = recorded.edges;
    const expected = ['exit'];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The edge is what closes the block: the printer's `edge()` marks the current
 * block terminated, so the statement the block visitor walks next lands in an
 * unreachable one. The visitor reports the edge; the printer owns the flag —
 * which is why this spec asserts the edge went out, not that a boolean
 * flipped. A spec asserting `closed === true` here would be asserting the
 * printer's half of the contract from the visitor's suite.
 */
test('return visitor: next block is unreachable when return is mid-block', (t) => {
    const recorded = api(RETURN);
    
    visitReturn(returnNode(RETURN), recorded.api);
    
    const result = {
        edges: recorded.edges,
        prints: recorded.stmts,
    };
    
    const expected = {
        edges: ['exit'],
        prints: ['return a;'],
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('return visitor: argument printed as stmt before edge', (t) => {
    const recorded = api(RETURN);
    
    visitReturn(returnNode(RETURN), recorded.api);
    
    const result = [
        ...recorded.stmts,
        ...recorded.edges,
    ];
    
    const expected = [
        'return a;',
        'exit',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The statement is the **source text**, not a re-print of the node —
 * semicolon, odd spacing and all.
 *
 * `stmts` are what a reader compares against the editor, so a block holding
 * `return   "a"  ;` must show that and not a tidied version of it. Slicing by
 * `start`/`end` is what guarantees it, and this spec is what stops it being
 * replaced by a generator later — the difference is invisible on `return a`
 * and immediate on anything with unusual whitespace.
 */
test('return visitor: the statement is sliced from the source verbatim', (t) => {
    const odd = 'function f() { return   "a"  ; }';
    const recorded = api(odd);
    
    visitReturn(returnNode(odd), recorded.api);
    
    const result = recorded.stmts;
    const expected = ['return   "a"  ;'];
    
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
    const recorded = api(BARE);
    
    visitReturn(returnNode(BARE), recorded.api);
    
    const result = recorded.stmts;
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});
