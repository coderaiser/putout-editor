import {test} from 'supertape';
import {
    type ParserOptions,
    parse,
    type Node,
} from '@babel/parser';
import {visitIf} from '../../lib/visitors/if.ts';
import type {FlowApi} from '../../lib/visitors/api.ts';

const parseOptions: ParserOptions = {
    sourceType: 'module',
    strictMode: false,
    plugins: ['jsx', 'typescript'],
};

/**
 * The `IfStatement` inside `function f() { … }`, taken from real source
 * rather than hand-built — same reason as `return.spec.ts`: a hand-written
 * node agrees with the visitor only because the same author wrote both.
 */
const ifNode = (source: string): Node => {
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
    walks: string[];
    merges: string[];
    terminated: number[];
    api: FlowApi;
}

/**
 * The printer half of the `FlowApi` contract, recorded instead of executed.
 *
 * Blocks are numbered `branch()` calls in order from 1, like the printer's own
 * ids, so a spec asserts the edge targets the printer would assign rather
 * than an opaque counter. `walk` records the node type it was asked to walk —
 * the assertion is *which* arm the visitor dispatched, not what a real walk
 * would have printed — and `terminated` answers from a set the spec fills, so
 * "both arms ended in return" is stated, not derived.
 */
const api = (source: string, done: number[] = []): Recorded => {
    const stmts: string[] = [];
    const edges: string[] = [];
    const walks: string[] = [];
    const merges: string[] = [];
    const terminated = [...done];
    let next = 1;
    
    const self: FlowApi = {
        source,
        print: (line) => {
            stmts.push(line);
        },
        currentBlock: () => 0,
        edge: (to, label) => {
            edges.push(`-> ${String(to)}${label ? ` [${label}]` : ''}`);
        },
        edgeFrom: (from, to, label) => {
            edges.push(`${String(from)} -> ${String(to)}${label ? ` [${label}]` : ''}`);
        },
        terminated: (id) => terminated.includes(id),
        walk: (node) => {
            walks.push(node.type || '');
        },
        branch: () => next++,
        merge: (...from) => {
            const id = next++;
            
            merges.push(`merge(${from.join(',')}) -> ${String(id)}`);
            
            return id;
        },
        mergeUnreachable: () => {
            const id = next++;
            
            merges.push(`mergeUnreachable() -> ${String(id)}`);
            
            return id;
        },
        closed: () => false,
        unreachable: () => next++,
    };
    
    return {
        stmts,
        edges,
        walks,
        merges,
        terminated,
        api: self,
    };
};

const NO_ELSE = 'function f() { if (a) b(); }';
const WITH_ELSE = 'function f() { if (a) b(); else c(); }';
const NESTED = 'function f() { if (a) { if (b) c(); } }';
const BOTH_DONE = 'function f() { if (a) return b; else return c; }';

test('if visitor: no else — false edge goes to merge block', (t) => {
    const recorded = api(NO_ELSE);
    
    visitIf(ifNode(NO_ELSE), recorded.api);
    
    const result = recorded.edges;
    const expected = [
        '0 -> 1 [true]',
        '0 -> 2 [false]',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('if visitor: with else — two branches then merge', (t) => {
    const recorded = api(WITH_ELSE);
    
    visitIf(ifNode(WITH_ELSE), recorded.api);
    
    const result = {
        walks: recorded.walks,
        merges: recorded.merges,
    };
    
    const expected = {
        walks: [
            'ExpressionStatement',
            'ExpressionStatement',
        ],
        merges: ['merge(1,2) -> 3'],
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('if visitor: nested if inside then branch', (t) => {
    const recorded = api(NESTED);
    
    visitIf(ifNode(NESTED), recorded.api);
    
    const result = recorded.walks;
    const expected = ['BlockStatement'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('if visitor: both branches terminate — merge block unreachable', (t) => {
    const recorded = api(BOTH_DONE, [1, 2]);
    
    visitIf(ifNode(BOTH_DONE), recorded.api);
    
    const result = recorded.merges;
    const expected = ['mergeUnreachable() -> 3'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('if visitor: condition is last stmt of condition block', (t) => {
    const recorded = api(NO_ELSE);
    
    visitIf(ifNode(NO_ELSE), recorded.api);
    
    const result = recorded.stmts.at(-1);
    const expected = 'a ?';
    
    t.equal(result, expected);
    t.end();
});
