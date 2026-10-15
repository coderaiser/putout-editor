import type {Node} from '@babel/parser';
import type {FlowApi} from './api.ts';

/**
 * The exact source text of a node.
 *
 * Sliced by `start`/`end` rather than rebuilt from the node's parts, which is
 * the whole reason `stmts` are source strings: a reader compares a block
 * against the editor and must see `return a` where the file has `return a`,
 * not a re-print of it with the printer's own spacing, quotes or trailing
 * semicolon. `@babel/parser` sets both offsets on every node, so this needs
 * no generator and no second formatting decision anywhere in this package.
 */
const textOf = (node: Node, source: string): string => {
    const {start, end} = node as unknown as {start: number; end: number};

    return source.slice(start, end);
};

/**
 * `return` ends the block.
 *
 * The argument is printed **as source**, before the edge, and a bare `return;`
 * prints nothing at all: the node has no `argument`, so the block genuinely
 * has no statement to show. Writing `return undefined` for it would put source
 * in the graph that the file does not contain.
 *
 * `closed()` is how the *next* visitor learns the block ended: `visitBlock`
 * asks it before walking each child and routes what follows a terminator into
 * an unreachable block. The flag itself is the printer's — the visitor only
 * reports the edge that set it.
 */
export const visitReturn = (node: Node, api: FlowApi): void => {
    const {argument} = node as unknown as {argument?: Node};

    if (argument)
        api.print(textOf(node, api.source));

    api.edge('exit');
};
