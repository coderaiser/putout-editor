import {test} from 'supertape';
import {type ParserOptions, parse} from '@babel/parser';
import type {Node} from '@babel/parser';
import {visitBlock, visitStatement} from '../../lib/visitors/block.ts';
import type {FlowApi} from '../../lib/visitors/api.ts';

const parseOptions: ParserOptions = {
    sourceType: 'module',
    strictMode: false,
    plugins: ['jsx', 'typescript'],
};

/**
 * A `BlockStatement` taken from real source — same reason as
 * `return.spec.ts`: parsing means a change to what the visitor reads breaks
 * this spec instead of passing it.
 */
const blockNode = (source: string): Node => {
    const ast = parse(source, parseOptions);
    const fn = ast.program.body[0] as unknown as {body: Node};

    return fn.body;
};

interface Recorded {
    stmts: string[];
    walks: string[];
    unreachable: () => number;
    api: FlowApi;
}

/**
 * The printer half of the `FlowApi` contract, recorded instead of executed.
 *
 * `closed` answers from a script the spec fills — one boolean per child — so
 * "the block closed after the first statement" is stated, not derived. `walk`
 * records the node type dispatched, and `unreachable` counts its own calls:
 * the third plan case opens exactly one unreachable block however many
 * statements follow the terminator.
 */
const api = (source: string): Recorded => {
    const stmts: string[] = [];
    const walks: string[] = [];
    let unreachable = 0;
    let shut = false;

    const self: FlowApi = {
        source,
        print: (line) => {
            stmts.push(line);
        },
        currentBlock: () => 0,
        edge: () => {},
        edgeFrom: () => {},
        terminated: () => false,
        walk: (node) => {
            walks.push(node.type || '');

            if (node.type === 'ReturnStatement')
                shut = true;
        },
        branch: () => 0,
        merge: () => 0,
        mergeUnreachable: () => 0,
        closed: () => shut,
        unreachable: () => {
            unreachable++;

            return 0;
        },
    };

    return {stmts, walks, unreachable: () => unreachable, api: self};
};

const BODY = 'function f() { const a = 1; f(a); }';

test('block visitor: empty BlockStatement no stmts', (t) => {
    const source = 'function f() {}';
    const recorded = api(source);

    visitBlock(blockNode(source), recorded.api);

    const result = {
        stmts: recorded.stmts,
        walks: recorded.walks,
    };
    const expected = {
        stmts: [],
        walks: [],
    };

    t.deepEqual(result, expected);
    t.end();
});

test('block visitor: statements append to current block', (t) => {
    const recorded = api(BODY);

    visitBlock(blockNode(BODY), recorded.api);

    const result = {
        walks: recorded.walks,
        unreachable: recorded.unreachable(),
    };
    const expected = {
        walks: [
            'VariableDeclaration',
            'ExpressionStatement',
        ],
        unreachable: 0,
    };

    t.deepEqual(result, expected);
    t.end();
});

test('block visitor: statements after terminator land in unreachable block', (t) => {
    const source = 'function f() { return a; b(); c(); }';
    const recorded = api(source);

    visitBlock(blockNode(source), recorded.api);

    const result = {
        walks: recorded.walks,
        unreachable: recorded.unreachable(),
    };
    const expected = {
        walks: [
            'ReturnStatement',
            'ExpressionStatement',
            'ExpressionStatement',
        ],
        unreachable: 2,
    };

    t.deepEqual(result, expected);
    t.end();
});

test('block visitor: a bare statement prints its own source', (t) => {
    const recorded = api(BODY);
    const ast = parse(BODY, parseOptions);
    const fn = ast.program.body[0] as unknown as {body: {body: Node[]}};
    const stmt = fn.body.body[1];

    visitStatement(stmt, recorded.api);

    const result = recorded.stmts;
    const expected = ['f(a);'];

    t.deepEqual(result, expected);
    t.end();
});
