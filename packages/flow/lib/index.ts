import {parse, type Block} from './parser.ts';
import {print} from './printer.ts';

/**
 * Source in, blocks out — the package's two halves joined.
 *
 * `buildCFG` parses the printed text rather than the AST directly, so both
 * sides of the round-trip always agree: the printer owns the format and the
 * parser owns the reading of it, and this function is the only place the two
 * meet. `index.spec.ts` asserts `parse(print(x))` deepEquals `buildCFG(x)`
 * for exactly this reason — it is a tautology today and must stay one, since
 * a printer that changed shape would have to change both or fail the spec.
 */
export const buildCFG = (source: string): Block[] => parse(print(source));

/**
 * The blocks no path reaches — the `remove-unreachable-code` consumer's
 * query, and the reason `unreachable` exists on `Block` at all.
 *
 * A `filter`, not a mutation: the caller keeps its blocks, and the `[unreachable]`
 * header is the printer's annotation, so this answers *which* of them carry
 * it rather than recomputing reachability. Reachability by walking `succs`
 * would be a second opinion about a mark the printer already made — and
 * `preds` are never stored, always derived, so a walk here would redo the
 * work in O(n) each call.
 */
export const findUnreachable = (blocks: Block[]): Block[] => blocks.filter(({unreachable}) => Boolean(unreachable));

export type {
    Block,
    Succ,
} from './parser.ts';

export {parse} from './parser.ts';
export {print} from './printer.ts';
