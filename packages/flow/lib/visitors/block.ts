import type {Node} from '@babel/types';
import type {FlowApi} from './api.ts';

/**
 * The exact source text of a node.
 *
 * Sliced by `start`/`end` rather than rebuilt from the node's parts — same
 * reason as `return.ts`: `stmts` are what a reader compares against the
 * editor, so a block body must read as written, not as re-printed.
 */
const textOf = (node: Node, source: string): string => {
    const {start, end} = node as unknown as {
        start: number;
        end: number;
    };
    
    return source.slice(start, end);
};

/**
 * A `BlockStatement` walks its body in order and nothing else.
 *
 * No statements of its own: the braces are structure, not code, so they never
 * reach `print`. When the incoming block is already closed — a `return` ended
 * it — the statements after the terminator walk in an unreachable block the
 * api opens for them, which is exactly the plan's third `block` case.
 */
export const visitBlock = (node: Node, api: FlowApi): void => {
    const {body} = node as unknown as {
        body: Node[];
    };
    
    for (const child of body) {
        if (api.closed())
            api.unreachable();
        
        api.walk(child);
    }
};

/**
 * Any other statement is one source line in the current block.
 *
 * `textOf`, not a re-print: `stmts` are what a reader compares against the
 * editor, so `const a = 1;` keeps its semicolon, its spacing, its quotes.
 */
export const visitStatement = (node: Node, api: FlowApi): void => {
    api.print(textOf(node, api.source));
};
