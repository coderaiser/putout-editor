import type {Node} from '@babel/types';

/**
 * The printer API for a visitor. Recurse through `walk`.
 * - `branch()`: open a block for one `if` arm and select it. One per arm.
 * - `merge(...from)`: open the join, add edges from open arms, select it.
 * - `mergeUnreachable()`: open the join with no edges. All arms terminated.
 * - `terminated(id)`: ask by id. A nested `if` changes the current block.
 * - `closed()` / `unreachable()`: `visitBlock` routes code after a `return`.
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
    mergeUnreachable(...from: number[]): number;
    closed(): boolean;
    unreachable(): number;
}
