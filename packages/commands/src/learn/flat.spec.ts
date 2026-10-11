import {test} from 'supertape';
import type {
    FlatLearnNode,
    LearnNode,
} from '../state.types.ts';
import {flattenLearn} from './flat.ts';
import {curriculum} from './curriculum.ts';

/**
 * A fixture small enough to assert the whole of, rather than the curriculum —
 * the structural claims are about the flattening, and the curriculum is what
 * `curriculum.spec.ts` covers.
 *
 *     root              (container)
 *     - branch          (container)
 *       - leaf          (example, no children)
 *     - alone           (leaf)
 */
const fixture: LearnNode[] = [{
    id: 'root',
    label: 'root',
    summary: 'the top',
    body: 'top body',
    children: [{
        id: 'root/branch',
        label: 'branch',
        summary: 'a branch',
        body: 'branch body',
        children: [{
            id: 'root/branch/leaf',
            label: 'leaf',
            summary: 'a leaf',
            body: 'leaf body',
            example: 'const a = 1;\n',
        }],
    }, {
        id: 'root/alone',
        label: 'alone',
        summary: 'on its own',
        body: 'alone body',
        example: 'const b = 2;\n',
    }],
}];

const rows = flattenLearn(fixture);

const byId = (id: string): FlatLearnNode => rows.find((row) => row.id === id) as FlatLearnNode;

test('flattenLearn: the root has depth 0 and pid null', (t) => {
    const root = byId('root');
    const result = {
        depth: root.depth,
        pid: root.pid,
    };
    const expected = {
        depth: 0,
        pid: null,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('flattenLearn: a child has depth 1 and pid matching its parent', (t) => {
    const branch = byId('root/branch');
    const result = {
        depth: branch.depth,
        pid: branch.pid,
    };
    const expected = {
        depth: 1,
        pid: 'root',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * Depth is per level, not per row.
 *
 * The second root child is the third row emitted and must still be depth 1 — an
 * accumulator that counted rows instead of levels would give it 2, and the
 * tree's connectors would indent it under `branch`.
 */
test('flattenLearn: depth counts levels, not rows', (t) => {
    const result = byId('root/alone').depth;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('flattenLearn: a grandchild has depth 2 and its parent as pid', (t) => {
    const leaf = byId('root/branch/leaf');
    const result = {
        depth: leaf.depth,
        pid: leaf.pid,
    };
    const expected = {
        depth: 2,
        pid: 'root/branch',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * Parents before children, the one ordering constraint every consumer relies
 * on: `visibleRows` resolves a `pid` while filtering, `expandMove` finds a first
 * child by `pid`, and the render maps in document order.
 */
test('flattenLearn: emits parents before their children', (t) => {
    const result = rows.map(({id}) => id);
    const expected = [
        'root',
        'root/branch',
        'root/branch/leaf',
        'root/alone',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('flattenLearn: a leaf has hasChildren=false', (t) => {
    const result = byId('root/branch/leaf').hasChildren;
    const expected = false;
    
    t.equal(result, expected);
    t.end();
});

test('flattenLearn: a container has hasChildren=true', (t) => {
    const result = byId('root/branch').hasChildren;
    const expected = true;
    
    t.equal(result, expected);
    t.end();
});

/**
 * `hasChildren` is about *having* children, not about being drawn.
 *
 * A node whose children are folded away still has them, so the caret has to
 * stay — which is why this reads `children.length` over the node rather than
 * asking anything about visibility.
 */
test('flattenLearn: hasChildren is true for a container with one child', (t) => {
    const [root] = fixture;
    const [branch] = root.children as LearnNode[];
    
    const result = flattenLearn([branch])[0].hasChildren;
    const expected = true;
    
    t.equal(result, expected);
    t.end();
});

test('flattenLearn: a leaf with an example has hasExample=true', (t) => {
    const result = byId('root/branch/leaf').hasExample;
    const expected = true;
    
    t.equal(result, expected);
    t.end();
});

/**
 * A container has no example, so `hasExample` is false on it.
 *
 * The pair of assertions `curriculum.spec.ts` makes about the data, seen from the
 * row's side: `[try it →]` is gated on this flag, and a container that carried
 * one would offer to try a concept that has no code.
 */
test('flattenLearn: a container has hasExample=false', (t) => {
    const result = byId('root').hasExample;
    const expected = false;
    
    t.equal(result, expected);
    t.end();
});

/**
 * `body` and `example` ride along on every row.
 *
 * Nothing in the tree draws them. They are here because `Enter` on a leaf hands
 * the row itself to `learnOpen`, and a row without them would force the
 * component to look the node up again — a lookup whose miss branch nothing can
 * reach, because the rows were built from the tree.
 */
test('flattenLearn: a row carries the body and the example', (t) => {
    const leaf = byId('root/branch/leaf');
    const result = {
        body: leaf.body,
        example: leaf.example,
    };
    const expected = {
        body: 'leaf body',
        example: 'const a = 1;\n',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('flattenLearn: a container row carries its body and no example', (t) => {
    const root = byId('root');
    const result = {
        body: root.body,
        example: root.example,
    };
    const expected = {
        body: 'top body',
        example: undefined,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('flattenLearn: an empty tree yields no rows', (t) => {
    const result = flattenLearn([]);
    const expected: unknown[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The real curriculum, flattened once.
 *
 * Not a structural re-assertion — `curriculum.spec.ts` owns that. This pins the
 * two claims only the real tree can make: that every row's `pid` resolves to a
 * row that exists, and that the root is the single `putout` node. A row with a
 * dangling `pid` renders as a detached branch the keyboard cannot walk into.
 */
test('flattenLearn: every row of the curriculum resolves its pid', (t) => {
    const flat = flattenLearn(curriculum);
    const ids = new Set(flat.map(({id}) => id));
    
    const dangling = flat
        .filter(({pid}) => pid !== null && !ids.has(pid))
        .map(({id}) => id);
    
    const result = dangling;
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('flattenLearn: the curriculum has one root at depth 0', (t) => {
    const roots = flattenLearn(curriculum).filter(({depth}) => depth === 0);
    
    const result = roots.map(({id}) => id);
    const expected = ['putout'];
    
    t.deepEqual(result, expected);
    t.end();
});
