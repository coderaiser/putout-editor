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
 * The `ReturnStatement` from real source, not a hand-built node. A change in
 * the node shape breaks this spec.
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
 * A recorded `FlowApi`. Only `print` and `edge` record. The other methods
 * do nothing: the printer owns them.
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
 * The statement is the source text, with its spacing and semicolon.
 * Stops a printer from replacing the slice.
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
 * A bare `return;` has no `argument`. Do not print `return undefined`.
 */
test('return visitor: a bare return prints no statement', (t) => {
    const recorded = api(BARE);
    
    visitReturn(returnNode(BARE), recorded.api);
    
    const result = recorded.stmts;
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});
