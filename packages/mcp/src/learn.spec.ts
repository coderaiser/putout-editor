import {test} from 'supertape';
import {
    learnExample,
    learnNode,
    learnTree,
} from './learn.ts';

/**
 * Three tools over the same tree, so the specs overlap where the contract does:
 * every one of them takes or returns an `id`, and a mismatch between the three
 * is the failure an agent meets as a 404 on a valid-looking id.
 */
const isString = (a: unknown): a is string => typeof a === 'string';

/**
 * Three tools over the same tree, so the specs overlap where the contract does:
 * every one of them takes or returns an `id`, and a mismatch between the three
 * is the failure an agent meets as a 404 on a valid-looking id.
 */
test('learn: the three tools are named learn_tree, learn_node and learn_example', (t) => {
    const result = [
        learnTree.name,
        learnNode.name,
        learnExample.name,
    ];
    
    const expected = [
        'learn_tree',
        'learn_node',
        'learn_example',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('learn: every description says what its answer is for', (t) => {
    const result = [
        learnTree.description,
        learnNode.description,
        learnExample.description,
    ].every((description) => isString(description) && description.length > 40);
    
    t.ok(result);
    t.end();
});

/**
 * `learn_tree`'s description is the only thing steering an agent away from
 * fetching several kilobytes on every turn.
 *
 * Asserted because it is a *cost* contract rather than documentation: the tool
 * has no rate limit and no size cap, so the sentence naming `learn_node` as the
 * cheap path is what keeps a long session from re-sending the whole curriculum
 * each time it needs one concept.
 */
test('learn_tree: description points at learn_node for a single concept', (t) => {
    const result = learnTree.description.includes('learn_node');
    
    t.ok(result);
    t.end();
});

test('learn_tree: schema takes no arguments', (t) => {
    const result = Object.keys(learnTree.schema.shape);
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('learn_node: schema requires an id', (t) => {
    const result = Object.keys(learnNode.schema.shape);
    const expected = ['id'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('learn_example: schema requires an id', (t) => {
    const result = Object.keys(learnExample.schema.shape);
    const expected = ['id'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('learn_tree: returns JSON with the top-level nodes', (t) => {
    const result = learnTree.handler().content[0].text;
    const expected = 'putout';
    
    t.match(result, expected);
    t.end();
});

/**
 * The answer is **parseable**, not merely non-empty.
 *
 * A handler that returned the tree as an inspected object would pass a
 * `t.match(result, 'putout')` and be useless to the agent consuming it, because
 * the whole point of the JSON is that it is traversed rather than read.
 */
test('learn_tree: the answer parses back into the tree', (t) => {
    const parsed = JSON.parse(learnTree.handler().content[0].text);
    
    const result = {
        isArray: Array.isArray(parsed),
        rootId: parsed[0].id,
    };
    
    const expected = {
        isArray: true,
        rootId: 'putout',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('learn_node: returns the body and the example for a known id', (t) => {
    const parsed = JSON.parse(learnNode.handler({
        id: 'ast/nodes/VariableDeclaration',
    }).content[0].text);
    
    const result = {
        label: parsed.label,
        hasBody: isString(parsed.body) && parsed.body.length > 0,
        hasExample: isString(parsed.example) && parsed.example.length > 0,
    };
    
    const expected = {
        label: 'VariableDeclaration',
        hasBody: true,
        hasExample: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * `related` comes back, because the description promises it.
 *
 * An agent reading "returns related (ids of related concepts)" and getting an
 * empty object has been told about a field the tool does not send — the same
 * class of bug as a `learn_node` that 404s on a documented id.
 */
test('learn_node: returns the related ids for a node that has them', (t) => {
    const parsed = JSON.parse(learnNode.handler({
        id: 'ast/nodes/VariableDeclaration',
    }).content[0].text);
    
    const result = Array.isArray(parsed.related) && parsed.related.length > 0;
    
    t.ok(result);
    t.end();
});

test('learn_node: lists the immediate child ids of a container', (t) => {
    const parsed = JSON.parse(learnNode.handler({
        id: 'ast',
    }).content[0].text);
    
    const result = parsed.child_ids;
    
    const expected = [
        'ast/nodes',
        'ast/traversal',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('learn_node: returns an error for an unknown id', (t) => {
    const result = learnNode.handler({
        id: 'ast/nodes/Nope',
    }).content[0].text;
    
    const expected = 'Error: unknown node: ast/nodes/Nope';
    
    t.equal(result, expected);
    t.end();
});

test('learn_example: returns the source string for a leaf id', (t) => {
    const result = learnExample.handler({
        id: 'patterns/__args',
    }).content[0].text;
    
    const expected = 'list.push("a", "b");\n';
    
    t.equal(result, expected);
    t.end();
});

/**
 * Raw source, not JSON.
 *
 * The answer is meant to be pasted straight into a fixture, so a quoting layer
 * around it would be one more thing for the consumer to strip — and the failure
 * mode of getting this wrong is a fixture containing `"list.push(...)"` with the
 * quotes as part of the string.
 */
test('learn_example: the answer is not JSON-wrapped', (t) => {
    const result = learnExample.handler({
        id: 'patterns/__args',
    }).content[0].text;
    
    t.notOk(result.startsWith('"'));
    t.end();
});

test('learn_example: returns an error for a container node id', (t) => {
    const result = learnExample.handler({
        id: 'ast',
    }).content[0].text;
    
    const expected = 'Error: ast is a container node with no example';
    
    t.equal(result, expected);
    t.end();
});

test('learn_example: returns an error for an unknown id', (t) => {
    const result = learnExample.handler({
        id: 'nope',
    }).content[0].text;
    
    const expected = 'Error: unknown node: nope';
    
    t.equal(result, expected);
    t.end();
});

/**
 * An id from `learn_node`'s `child_ids` resolves in `learn_example`.
 *
 * The cross-tool contract, and the one neither tool can see alone: an agent
 * walks down with `child_ids` and then asks for the example. A leaf reached that
 * way must answer, and a container reached that way must say so rather than
 * returning an empty string that looks like a fixture.
 */
test('learn: a child id from learn_node resolves in learn_example', (t) => {
    const nodes = JSON.parse(learnNode.handler({
        id: 'ast/nodes',
    }).content[0].text);
    
    const [leafId] = nodes.child_ids;
    
    const answer = learnExample.handler({
        id: leafId,
    }).content[0].text;
    
    const result = answer.length > 0 && !answer.startsWith('Error:');
    
    t.ok(result);
    t.end();
});

test('learn_tree: the outline has no lesson text', (t) => {
    const result = learnTree
        .handler()
        .content[0]
        .text
        .includes('"body"');
    
    t.notOk(result);
    t.end();
});

test('learn_tree: the outline is at most 6000 bytes', (t) => {
    const result = learnTree.handler().content[0].text.length <= 6000;
    
    t.ok(result);
    t.end();
});

test('learn_tree: the outline keeps the ids of nested nodes', (t) => {
    const result = learnTree
        .handler()
        .content[0]
        .text
        .includes('"ast/nodes/VariableDeclaration"');
    
    t.ok(result);
    t.end();
});

test('learn_tree: the description does not ask to be called first', (t) => {
    const result = learnTree.description.includes('Call this first');
    
    t.notOk(result);
    t.end();
});
