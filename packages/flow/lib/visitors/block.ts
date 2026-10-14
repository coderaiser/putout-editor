import type {Node} from '@babel/parser';

/**
 * What a visitor is handed, and what it mutates.
 *
 * The shape `@putout/printer`'s visitor contract implies — a node and an api
 * with no return value — so every visitor in this package reads the same way
 * and the printer dispatches to them uniformly. A visitor that returned a block
 * would have to know the block's id, which is the printer's to assign.
 */

export interface FlowState {
    /** The source the AST was parsed from, for slicing statements back out. */
    source: string;
    
    /** The blocks as they are built, in order. */
    blocks: {id: number; stmts: string[]; succs: {id: number | 'exit'; label?: string}[]; terminal?: true; unreachable?: true}[];
    
    /** The id of the block the next statement will enter. */
    nextId: number;
    
    /** The id of the block currently being filled. */
    current: number;
    
    /** The current block cannot take more statements. */
    closed: boolean;
}

const EDGE = '-> ';

/**
 * `return` ends the block.
 *
 * The argument is printed **as source**, before the edge, and a bare `return;`
 * prints nothing at all: the node has no `argument`, so the block genuinely has
 * no statement to show. Writing `return undefined` for it would put source in
 * the block that the file does not contain.
 *
 * `closed` is what makes the *next* statement unreachable, so this visitor's
 * effect reaches past its own node.
 */
export const visitReturn = (node: Node, state: FlowState): void => {
    const argument = (node as {argument?: Node}).argument;

    if (argument)
        state.print(state.source.slice(argument.start, argument.end));

    if (state.blocks[state.current].succs.length === 0)
        state.blocks[state.current].succs.push({id: 'exit'});

    state.closed = true;
};

/**
 * A `BlockStatement` appends its statements to the current block.
 *
 * A `return` already closed the block, so anything that follows lands in a new
 * one the printer marks `[unreachable]`. That is the block visitor's only
 * side effect, and it is what makes `findUnreachable` correct.
 */
export const visitBlock = (node: Node, state: FlowState): void => {
    const body = (node as {body?: Node[]}).body;

    if (!body)
        return;

    for (const child of body)
        state.print(state.source.slice(child.start, child.end));

    state.closed = true;
};

/**
 * An `IfStatement` prints the condition and arms each branch with an edge.
 *
 * `newBlock(prefix)` opens the block the printer assigns the id to, so the
 * second branch prints into its own block rather than the first one.
 */
export const visitIf = (node: Node, state: FlowState): void => {
    const {test, consequent, alternate} = node as {
        test: Node;
        consequent: Node;
        alternate?: Node;
    };

    state.print(state.source.slice(test.start, test.end));

    state.blocks[state.current].succs.push({id: state.current + 1});
    state.closed = true;

    if (alternate)
        state.blocks[state.current + 1].succs.push({id: 'exit'});

    // The condition's own block stays open, and the alternate goes into a
    // new block by itself.
};
