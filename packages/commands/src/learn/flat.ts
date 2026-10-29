import type {FlatLearnNode, LearnNode} from '../state.types.ts';

/**
 * The curriculum as rows for `LearnTree`. Depth first, parent before
 * children: `visibleRows`, `expandMove` and the render need this order.
 */
export function flattenLearn(nodes: LearnNode[], pid: string | null = null, depth = 0): FlatLearnNode[] {
    const result: FlatLearnNode[] = [];
    
    for (const node of nodes) {
        const children = node.children || [];
        
        result.push({
            id: node.id,
            pid,
            depth,
            label: node.label,
            summary: node.summary,
            body: node.body,
            example: node.example,
            hasExample: Boolean(node.example),
            hasChildren: children.length > 0,
        });
        
        result.push(...flattenLearn(children, node.id, depth + 1));
    }
    
    return result;
}
