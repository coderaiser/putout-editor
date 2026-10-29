import {z} from 'zod';
import {curriculum, findLearnNode} from '@putout/editor-commands/learn/curriculum';
import {errorText, text} from '@putout/editor-commands/content';
import type {LearnNode} from '@putout/editor-commands';

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

type Outline = {
    id: string;
    label: string;
    summary: string;
    children?: Outline[];
};

/** A node with its id, label and summary only. The text stays in `learn_node`. */
const outlineOf = ({id, label, summary, children}: LearnNode): Outline => {
    const outline: Outline = {
        id,
        label,
        summary,
    };
    
    if (children)
        outline.children = children.map(outlineOf);
    
    return outline;
};

export const learnTree = {
    name: 'learn_tree',
    
    description:
        'Return the outline of the putout curriculum: id, label, summary and children of each node. ' +
        'Use it to find an id. Then use learn_node for the text and learn_example for the code.',
    
    schema: z.object({}),
    handler: () => text(JSON.stringify(curriculum.map(outlineOf))),
};

export const learnNode = {
    name: 'learn_node',
    
    description: 'One curriculum node by id: body, example, related ids and child ids.',
    
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
    
    description: 'The example source of one curriculum node, to use as a fixture. Error when the node has no example.',
    
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
