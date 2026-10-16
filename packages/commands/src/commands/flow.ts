import {tryCatch} from 'try-catch';
import {buildCFG} from '@putout/flow';
import type {Block} from '@putout/flow';
import type {ChatState, CommandResult} from '../state.types.ts';

/**
 * `flow` graphs the current source into control-flow blocks. A source must be
 * set first — a function body without anything to graph is an error, not an
 * empty graph, so a user never mistakes "nothing graphed" for "nothing parsed".
 */
export const runFlow = (args: string, state: ChatState): CommandResult => {
    const {source} = state;

    if (!source)
        return {
            type: 'error',
            message: 'No source. Use source first.',
        };

    if (!args)
        return {
            type: 'error',
            message: 'No function body. Put the function on the next line.',
        };

    const [error, blocks] = tryCatch(buildCFG, args);

    if (error)
        return {
            type: 'error',
            message: (error as Error).message,
        };

    const text = blocksToText(blocks);

    return {
        type: 'flow',
        text,
        blocks,
        source,
    };
};

/**
 * Graph → text, so an MCP tool or a snapshot test can read the flow without
 * parsing it again. Prints every block with its statements and edges.
 */
const blocksToText = (blocks: Block[]): string => {
    const lines: string[] = [];

    for (const block of blocks) {
        lines.push(`block ${block.id}${block.unreachable ? ' [unreachable]' : ''}`);

        for (const stmt of block.stmts)
            lines.push(`  ${stmt}`);

        for (const succ of block.succs) {
            const label = succ.label ? ` [${succ.label}]` : '';

            lines.push(`  -> ${String(succ.id)}${label}`);
        }
    }

    return lines.join('\n');
};
