import type {Node} from '@babel/types';
import type {FlowApi} from './api.types.ts';

/**
 * The source text of a node, sliced by `start`/`end`. A reader must see
 * `return a` as the file has it, not as a printer formats it.
 */
const textOf = (node: Node, source: string): string => {
    const {start, end} = node as unknown as {
        start: number;
        end: number;
    };
    
    return source.slice(start, end);
};

/**
 * `return` ends the block. Print the argument as source, then the edge to
 * `exit`. A bare `return;` prints no statement. `visitBlock` asks `closed()`
 * before each child.
 */
export const visitReturn = (node: Node, api: FlowApi): void => {
    const {argument} = node as unknown as {
        argument?: Node;
    };
    
    if (argument)
        api.print(textOf(node, api.source));
    
    api.edge('exit');
};
