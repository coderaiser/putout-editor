import {parse, type Block} from './parser.ts';
import {print} from './printer.ts';

/**
 * Source in, blocks out. `buildCFG` parses the printed text, so the printer
 * and the parser always agree. `index.spec.ts` checks that
 * `parse(print(x))` equals `buildCFG(x)`.
 */
export const buildCFG = (source: string): Block[] => parse(print(source));

/**
 * The blocks that no path reaches. Reads the `unreachable` mark of the
 * printer. Does not walk `succs` again and does not change the blocks.
 */
export const findUnreachable = (blocks: Block[]): Block[] => blocks.filter(({unreachable}) => Boolean(unreachable));

export {
    type Block,
    type Succ,
    parse,
} from './parser.ts';

export {print} from './printer.ts';
