import type {Node} from '@babel/parser';

/**
 * What a visitor is handed, and what it mutates.
 *
 * The shape `@putout/printer`'s visitor contract implies — a node and an api
 * with no return value — so every visitor in this package reads the same way
 * and the printer dispatches to them uniformly. A visitor that returned a block
 * would have to know the block's id, which is the printer's to assign.
 *
 * `closed` is the one piece of shared state a visitor writes and another reads:
 * it says the current block cannot take more statements, so the block visitor
 * routes what follows into an unreachable one.
 */
export interface FlowState {
    /** The source the AST was parsed from, for slicing statements back out. */
    source: string;
    
    /** Emit a line of the current block's body, or an edge, as flow text. */
    print(line: string): void;
    
    /** Emit an edge out of the current block, by target id or `exit`. */
    edge(to: string): void;
    
    /** Set when the current block cannot fall through. */
    closed: boolean;
}

/**
 * The exact source text of a node.
 *
 * Sliced by `start`/`end` rather than rebuilt from the node's parts, which is
 * the whole reason `stmts` are source strings: a reader compares a block against
 * the editor and must see `return a` where the file has `return a`, not a
 * re-print of it with the printer's own spacing, quotes or trailing semicolon.
 * `@babel/parser` sets both offsets on every node, so this needs no generator
 * and no second formatting decision anywhere in this package.
 */
const textOf = (state: FlowState, node: Node): string => {
    const {start, end} = node as {start: number; end: number};

    return state.source.slice(start, end);
};

/**
 * `return` ends the block.
 *
 * The argument is printed **as source**, before the edge, and a bare `return;`
 * prints nothing at all: the node has no `argument`, so the block genuinely has
 * no statement to show. Writing `return undefined` for it would put source in
 * the graph that the file does not contain.
 *
 * `closed` is what makes the *next* statement unreachable, so this visitor's
 * effect reaches past its own node — see `block.ts`.
 */
export const visitReturn = (node: Node, state: FlowState): void => {
    const argument = (node as {argument?: Node}).argument;

    if (argument)
        state.print(textOf(state, node));

    state.edge('exit');
    state.closed = true;
};
