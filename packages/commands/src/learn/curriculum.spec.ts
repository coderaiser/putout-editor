import {test} from 'supertape';
import type {LearnNode} from '../state.types.ts';
import {
    curriculum,
    findLearnNode,
    learnNodes,
} from './curriculum.ts';

/**
 * The curriculum is prose, so these are **structural** assertions rather than
 * one test per string. They are what makes the file safe to grow: a new node
 * that forgets its `example`, duplicates an `id`, or points `related` at
 * something that does not exist fails here rather than rendering as a dead row
 * or as a 404 in an agent's `learn_node` call.
 *
 * Nothing here asserts *what* a body says. That is a review judgement, and a
 * spec that pinned the wording would be a spec nobody dares update.
 */
const isLeaf = (node: LearnNode) => !node.children || !node.children.length;

const all = learnNodes(curriculum);

const leaves = all.filter(isLeaf);
const containers = all.filter((node) => !isLeaf(node));

test('curriculum: every node has an id, a label, a summary and a body', (t) => {
    const missing: string[] = [];
    
    for (const {id, label, summary, body} of all)
        if (!id || !label || !summary || !body)
            missing.push(id || label);
    
    const result = missing;
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * A container with an `example` is the more damaging of the two directions.
 *
 * `Enter` on a container expands it — that is the whole of what a caret means —
 * and an example on one would render a `[try it →]` on a row whose job is to
 * open. So both arms are asserted, not just "leaves have examples".
 */
test('curriculum: every leaf has a non-empty example', (t) => {
    const missing: string[] = [];
    
    for (const {id, example} of leaves)
        if (!example)
            missing.push(id);
    
    const result = missing;
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('curriculum: no container carries an example', (t) => {
    const carrying: string[] = [];
    
    for (const {id, example} of containers)
        if (example)
            carrying.push(id);
    
    const result = carrying;
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * `id` is the only thing that names a node — it is the mcp tool's argument, the
 * `LearnTree` row's key and the `related` target — so a duplicate is not a
 * cosmetic problem: `findLearnNode` would silently answer with the first of
 * them and half the graph would point at the wrong concept.
 */
test('curriculum: every id is unique', (t) => {
    const ids = [];
    
    for (const {id} of all) {
        ids.push(id);
    }
    
    const seen = new Set<string>();
    const duplicated: string[] = [];
    
    for (const id of ids) {
        if (seen.has(id))
            duplicated.push(id);
        
        seen.add(id);
    }
    
    const result = duplicated;
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * Every `related` id must resolve.
 *
 * The plan defers this to "a second pass". It is here from the start, because a
 * dangling link is exactly the defect that is invisible until an agent asks for
 * the concept it points at — and by then the answer is an error string rather
 * than a failing test.
 */
test('curriculum: every related id refers to an existing node', (t) => {
    const dangling: string[] = [];
    
    for (const {id, related} of all)
        for (const target of related || [])
            if (!findLearnNode(target))
                dangling.push(`${id} -> ${target}`);
    
    const result = dangling;
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * A node may not be its own `related`.
 *
 * Not reachable through the data today, and worth pinning anyway: `related`
 * exists for graph traversal, and a self-edge is an infinite loop in any
 * consumer that walks it without a visited set.
 */
test('curriculum: no node relates to itself', (t) => {
    const selfish: string[] = [];
    
    for (const {id, related} of all)
        if ((related || []).includes(id))
            selfish.push(id);
    
    const result = selfish;
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * Depth-bounded: no node sits deeper than the tree's own structure allows.
 *
 * Written as a bound on the ids rather than as a cycle detector, because the
 * curriculum is a **literal** — a cycle in it would have to be built by mutating
 * the array at runtime, and a detector for that would be code nothing can
 * exercise. The bound is the honest form of the same claim: the deepest id is
 * three segments (`ast/nodes/VariableDeclaration`), and a node nested under its
 * own descendant would make `learnNodes` recurse until the stack ran out long
 * before any assertion could see it.
 */
test('curriculum: no id is deeper than three segments', (t) => {
    const result = Math.max(...all.map(({id}) => id.split('/').length));
    const expected = 3;
    
    t.equal(result, expected);
    t.end();
});

test('learnNodes: walks parents before their children', (t) => {
    const result = learnNodes(curriculum)
        .map(({id}) => id)
        .slice(0, 3);
    const expected = [
        'putout',
        'ast',
        'ast/nodes',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The default-argument form, called the way every real caller calls it.
 *
 * `tsc` cannot tell a default parameter from a required one, so the branch is
 * covered by asking for no argument at all.
 */
test('learnNodes: defaults to the whole curriculum', (t) => {
    const result = learnNodes().length;
    const expected = all.length;
    
    t.equal(result, expected);
    t.end();
});

test('learnNodes: walks an explicit subtree', (t) => {
    const [ast] = curriculum[0].children as LearnNode[];
    
    // `ast` itself is in the answer — a subtree walk starts at its root — so the
    // test is "the subtree, and nothing outside it", not "every id is nested".
    const ids = learnNodes([ast]).map(({id}) => id);
    const result = ids.every((id) => id === 'ast' || id.startsWith('ast/'));
    
    t.ok(result);
    t.end();
});

test('findLearnNode: finds a deeply nested node by id', (t) => {
    const node = findLearnNode('ast/nodes/VariableDeclaration');
    const result = node && node.label;
    const expected = 'VariableDeclaration';
    
    t.equal(result, expected);
    t.end();
});

test('findLearnNode: finds the root', (t) => {
    const node = findLearnNode('putout');
    const result = node && node.label;
    const expected = 'putout';
    
    t.equal(result, expected);
    t.end();
});

test('findLearnNode: returns null for an unknown id', (t) => {
    const result = findLearnNode('ast/nodes/Nope');
    
    t.notOk(result);
    t.end();
});

/**
 * An empty tree answers `null` rather than `undefined` or a throw.
 *
 * The `|| null` on the end of `findLearnNode` exists for this: `.find()` yields
 * `undefined`, and both the mcp handler and `LearnBlock` guard with `if (!node)`
 * — which `undefined` would satisfy by accident rather than by contract.
 */
test('findLearnNode: returns null when the tree is empty', (t) => {
    const result = findLearnNode('putout', []);
    
    t.notOk(result);
    t.end();
});
