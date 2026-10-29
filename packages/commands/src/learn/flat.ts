import type {FlatLearnNode, LearnNode} from '../state.types.ts';

/**
 * The curriculum as rows, the shape `LearnTree` draws.
 *
 * The sibling of `flattenAst`, and deliberately **not** in `flat.ts` with it:
 * `flattenAst` parses a babel AST whose every child is found by walking
 * `Object.values`, and shares nothing with this but the shape of its output.
 * Two functions in one file because their return types rhyme is how a file ends
 * up importing the parser to flatten a constant.
 *
 * Rows are emitted depth first, parents before children — the order the tree
 * widget depends on for three separate things: `visibleRows` walks `pid` to
 * decide what a collapsed node hides, `expandMove` finds "the first child" with
 * a `pid` lookup, and the render maps in document order. Any other order breaks
 * all three at once.
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
