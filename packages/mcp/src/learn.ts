import {z} from 'zod';
import {curriculum, findLearnNode} from '@putout/editor-commands/learn/curriculum';
import {errorText, text} from '@putout/editor-commands/content';
import type {LearnNode} from '@putout/editor-commands';

/**
 * Three tools over one tree, with one id contract. The schemas come first:
 * a handler that names its own tool object in `z.input<...>` is a TypeScript
 * error (implicit `any` in its own initializer).
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
     * One concept: its fields, `child_ids`, and each child as
     * `id`/`label`/`summary`. `child_ids` is for an agent that walks down;
     * the child objects are for a view of one level.
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
