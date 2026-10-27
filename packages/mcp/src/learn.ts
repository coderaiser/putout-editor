import {z} from 'zod';
import {curriculum, findLearnNode} from '@putout/editor-commands/learn/curriculum';
import {errorText, text} from '@putout/editor-commands/content';

/**
 * Three tools over one tree, in one file.
 *
 * They share `findLearnNode`, and their descriptions have to say the same thing
 * about ids three times — so splitting them would split a contract that is one
 * contract. `createServer()` registers each by its own `name`.
 */

/**
 * The two schemas are declared before the objects that use them.
 *
 * A handler written as `({id}: z.input<typeof learnNode.schema>)` names the
 * object it is a property of, which TypeScript rejects: `'learnNode' implicitly
 * has type 'any' because it is referenced directly or indirectly in its own
 * initializer`. The schema is the contract and the tool object is packaging, so
 * the contract comes first.
 */
const nodeSchema = z.object({
    id: z
        .string()
        .describe('Node id from learn_tree, e.g. "ast/nodes/VariableDeclaration"'),
});

const exampleSchema = z.object({
    id: z
        .string()
        .describe('Node id from learn_tree'),
});

export const learnTree = {
    name: 'learn_tree',
    
    description:
        'Return the full putout curriculum as a nested tree. ' +
        'Call this first to see what concepts exist before asking for details. ' +
        'Each node has an id, label, summary, and optional children. ' +
        'Use the id with learn_node or learn_example for details.',
    
    schema: z.object({}),
    /**
     * The whole curriculum, indented, in one answer.
     *
     * `JSON.stringify` rather than the tree rendered as text: an agent consuming
     * this wants to *traverse* it, and a pretty-printed ASCII tree would have to
     * be re-parsed by the thing reading it. The indentation is what makes it
     * readable when a human inspects the call, and it is free.
     *
     * `body` is **not** stripped, which is why the description warns against
     * calling this per turn: the full tree with every explanation is several
     * kilobytes. An agent that needs one concept should use `learn_node`, and
     * that sentence is the only thing steering it away from the expensive call.
     */
    handler: () => text(JSON.stringify(curriculum, null, 2)),
};

export const learnNode = {
    name: 'learn_node',
    
    description:
        'Return the full details of one curriculum node by id. ' +
        'Returns body (explanation), example (source code if any), ' +
        'related (ids of related concepts), and children (immediate child ids). ' +
        'Use this when you know which concept you need — do not call learn_tree first ' +
        'if you already have the id.',
    
    schema: nodeSchema,
    /**
     * One concept in full.
     *
     * The node's own fields, plus `child_ids` — the ids of its immediate children,
     * so a caller walking *down* the tree gets the names without paying for the
     * prose below them. Children are also present as `id`/`label`/`summary`, which
     * is what a single level of browsing needs and is a fraction of the subtree.
     *
     * The two shapes are the same information twice on purpose: `child_ids` for an
     * agent deciding where to go next, the objects for one about to render the
     * level it is standing on.
     */
    handler: ({id}: z.input<typeof nodeSchema>) => {
        const node = findLearnNode(id);
        
        if (!node)
            return errorText(`unknown node: ${id}`);
        
        const children = node.children || [];
        
        return text(JSON.stringify({
            ...node,
            children: children.map(({id: childId, label, summary}) => ({
                id: childId,
                label,
                summary,
            })),
            child_ids: children.map(({id: childId}) => childId),
        }, null, 2));
    },
};

export const learnExample = {
    name: 'learn_example',
    
    description:
        'Return just the example source code for a curriculum node. ' +
        'Use this to get a ready-made fixture before writing a plugin — ' +
        'the example is known to produce the node or pattern the concept describes. ' +
        'Returns an error if the node has no example (container nodes do not).',
    
    schema: exampleSchema,
    /**
     * The example alone, as raw source.
     *
     * Not JSON-wrapped: the answer is meant to be pasted straight into a fixture,
     * so a quoting layer around it would be one more thing to strip. `text()`
     * rather than a code fence for the same reason.
     */
    handler: ({id}: z.input<typeof exampleSchema>) => {
        const node = findLearnNode(id);
        
        if (!node)
            return errorText(`unknown node: ${id}`);
        
        if (!node.example)
            return errorText(`${id} is a container node with no example`);
        
        return text(node.example);
    },
};
