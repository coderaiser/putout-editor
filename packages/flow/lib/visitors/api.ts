import type {Node} from '@babel/parser';

/**
 * What the printer hands every visitor, and what a visitor may do with it.
 *
 * The shape step 7 of the plan mandates — `(node, {print, currentBlock,
 * newBlock})`, no return value. `print(line)` appends a statement to the
 * current block; `currentBlock()` reads its id; ids themselves are the
 * printer's to assign, so a visitor that returned a block would have to know
 * an id it cannot know.
 *
 * Opening a block and wiring it are separate calls because only the printer
 * knows which block is current: `branch()` opens the block one `if` arm walks
 * in and selects it; `merge(...from)` opens the join, edges every
 * unterminated arm into it, and selects it. Two `branch()` calls per `if` —
 * never one shared — is what keeps duplicate `else` branches as two identical
 * blocks rather than one merged one.
 *
 * `mergeUnreachable()` opens the same join for the case nothing reaches
 * — both arms ended in `return` — and wires nothing, which the printer marks
 * `[unreachable]`. A separate name rather than `merge(..., false)`, because a
 * stub records a call either way and a boolean would read as the merge failing
 * rather than the join being dead. It takes no arm ids: an arm that
 * terminated already edged to `exit`, and an arm that did not must be wired
 * through `merge()` — the caller only reaches this arm when *every* arm
 * terminated.
 *
 * `walk` is the printer's own dispatch, handed down so a visitor recurses
 * through it rather than around it: a nested `if` inside a `then` arm reaches
 * `visitIf` through this call. `terminated(id)` asks whether a block ended in
 * a terminator — asked by id, not by node, because a nested `if` re-selects
 * the current block while the outer arm is still being walked, so asking
 * "is the current block closed" after the walk would answer about the join,
 * not the arm.
 *
 * `closed()` asks the same about the current block, and `unreachable()` opens
 * the block statements after a terminator walk in. The pair is how `visitBlock`
 * routes code after a `return` without knowing any ids.
 */
export interface FlowApi {
    source: string;
    print(line: string): void;
    currentBlock(): number;
    edge(to: number | 'exit', label?: string): void;
    edgeFrom(from: number, to: number | 'exit', label?: string): void;
    terminated(id: number): boolean;
    walk(node: Node): void;
    branch(): number;
    merge(...from: number[]): number;
    mergeUnreachable(): number;
    closed(): boolean;
    unreachable(): number;
}
