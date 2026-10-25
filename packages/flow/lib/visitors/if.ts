import type {Node} from '@babel/parser';
import type {FlowApi} from './api.ts';

/**
 * The exact source text of a node.
 *
 * Sliced by `start`/`end` rather than rebuilt from the node's parts — same
 * reason as `return.ts`: `stmts` are what a reader compares against the
 * editor, so the condition must read as written, not as re-printed.
 */
const textOf = (node: Node, source: string): string => {
    const {start, end} = node as unknown as {
        start: number;
        end: number;
    };
    
    return source.slice(start, end);
};

/**
 * `if` runs the true arm, the false arm, and the merge they rejoin in.
 *
 * The condition is the **last** statement of the condition block: everything
 * the printer already emitted into the current block stays where it is, and
 * the test is appended after it, so `let a = 1` / `x > 0 ?` read in program
 * order. Each arm walks in its **own** block (`branch()` per arm, never one
 * shared), which is what keeps `else c()` from sharing a block with `then
 * b()` when the two are textually identical.
 *
 * Termination is asked per arm id through `terminated()`, not read off the
 * walked node: an arm is a `BlockStatement`, which never has type
 * `ReturnStatement` however it ends, so asking the node would merge through a
 * join the program cannot reach. Both arms ending in `return` leaves the join
 * unreachable and it goes through `mergeUnreachable()`.
 *
 * With no `else`, the false edge leaves the condition block for the merge
 * directly — there is no second arm to walk, so the only block `merge()` has
 * to wire is the one the `then` arm may have left open.
 */
export const visitIf = (node: Node, api: FlowApi): void => {
    const {
        test,
        consequent,
        alternate,
    } = node as unknown as {
        test: Node;
        consequent: Node;
        alternate?: Node;
    };
    
    const condition = api.currentBlock();
    
    api.print(`${textOf(test, api.source)} ?`);
    
    const thenId = api.branch();
    
    api.edgeFrom(condition, thenId, 'true');
    api.walk(consequent);
    
    const thenDone = api.terminated(thenId);
    
    if (!alternate) {
        const mergeId = thenDone ? api.mergeUnreachable() : api.merge(thenId);
        
        api.edgeFrom(condition, mergeId, 'false');
        
        return;
    }
    
    const elseId = api.branch();
    
    api.edgeFrom(condition, elseId, 'false');
    api.walk(alternate);
    
    const elseDone = api.terminated(elseId);
    
    if (thenDone && elseDone) {
        api.mergeUnreachable(thenId, elseId);
        
        return;
    }
    
    api.merge(thenId, elseId);
};
