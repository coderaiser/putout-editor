import type {Node} from '@babel/types';
import type {FlowApi} from './api.types.ts';

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
 * `if`: the condition goes last in the current block. Each arm walks in its
 * own block, so two equal arms stay two blocks. Ask `terminated()` per arm
 * id: an arm is a `BlockStatement`, never a `ReturnStatement`. Both arms
 * terminated: `mergeUnreachable()`. No `else`: the false edge goes to the
 * join.
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
        // `merge()` and never `mergeUnreachable()`, even when `then` returned:
        // the false edge below reaches this join, so `if (a) return b; c();`
        // leaves `c()` reachable. `merge()` already skips an arm that ended in
        // `return`, so `thenId` is safe to pass either way.
        const mergeId = api.merge(thenId);
        
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
