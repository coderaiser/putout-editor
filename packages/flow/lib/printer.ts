import {parse, type ParserOptions} from '@babel/parser';
import type {Node} from '@babel/types';
import type {Succ} from './parser.ts';
import {visitBlock, visitStatement} from './visitors/block.ts';
import {visitIf} from './visitors/if.ts';
import {visitReturn} from './visitors/return.ts';
import type {FlowApi} from './visitors/api.types.ts';

const INDENT = '  ';
const EDGE = '-> ';

const parseOptions = {
    sourceType: 'module',
    strictMode: false,
    plugins: ['jsx', 'typescript'],
} satisfies ParserOptions;

/**
 * A block in progress: statements, edges, and `done` when it ended in a
 * terminator. `done` is what the printer knows. `terminal` is what the
 * parser infers from the text.
 */
interface Draft {
    id: number;
    stmts: string[];
    succs: Succ[];
    done: boolean;
    unreachable: boolean;
}

/**
 * The `FlowApi` contract on real blocks. `at` is the current block.
 * `branch()` opens a block, selects it and returns its id.
 * `merge()` adds an edge from each open arm to a new join and selects it.
 * A terminated arm already has an edge to `exit`.
 * `mergeUnreachable()` selects a new join with no edges.
 */
const run = (source: string, body: Node[]): Draft[] => {
    const drafts: Draft[] = [{
        id: 0,
        stmts: [],
        succs: [],
        done: false,
        unreachable: false,
    }];
    
    let at = 0;
    
    const draft = (): Draft => drafts[at];
    
    const open = (unreachable: boolean): number => {
        const id = drafts.length;
        
        drafts.push({
            id,
            stmts: [],
            succs: [],
            done: false,
            unreachable,
        });
        
        at = id;
        
        return id;
    };
    
    const edgeFrom = (from: number, to: number | 'exit', label?: string): void => {
        const succ: Succ = {
            id: to,
        };
        
        if (label)
            succ.label = label;
        
        drafts[from].succs.push(succ);
        
        if (to === 'exit')
            drafts[from].done = true;
    };
    
    const api: FlowApi = {
        source,
        print: (line) => {
            draft().stmts.push(line);
        },
        currentBlock: () => at,
        edge: (to, label) => {
            edgeFrom(at, to, label);
        },
        edgeFrom,
        terminated: (id) => drafts[id].done,
        walk: (node) => {
            dispatch(node, api);
        },
        branch: () => open(false),
        merge: (...from) => {
            const id = open(false);
            
            for (const arm of from) {
                if (!drafts[arm].done)
                    edgeFrom(arm, id);
            }
            
            return id;
        },
        mergeUnreachable: () => open(true),
        closed: () => draft().done,
        unreachable: () => open(true),
    };
    
    for (const child of body) {
        if (api.closed())
            api.unreachable();
        
        dispatch(child, api);
    }
    
    // A reachable block that never left its statements falls out the bottom —
    // the `exit` every path ends in. An unreachable draft gets no edge: the
    // format draws `[unreachable]` with its statements and nothing else, and
    // `-> exit` on a block nothing reaches is an edge no path can take. Both
    // halves are the printer spec's `return mid-block` case.
    if (!draft().unreachable && !draft().done && !draft().succs.length)
        edgeFrom(at, 'exit');
    
    return drafts;
};

const dispatch = (node: Node, api: FlowApi): void => {
    switch(node.type) {
    case 'ReturnStatement':
        visitReturn(node, api);
        break;
    
    case 'BlockStatement':
        visitBlock(node, api);
        break;
    
    case 'IfStatement':
        visitIf(node, api);
        break;
    
    default:
        visitStatement(node, api);
        break;
    }
};

/**
 * Drafts to text. One blank line separates blocks: the parser splits on
 * `\n\s*\n`. An edge has a `[true]` or `[false]` label; a join edge has none.
 */
const format = (drafts: Draft[]): string => {
    const lines: string[] = [];
    
    for (const [index, draft] of drafts.entries()) {
        if (index > 0)
            lines.push('');
        
        const head = draft.unreachable ? `block ${draft.id} [unreachable]` : `block ${draft.id}`;
        
        lines.push(head);
        
        for (const stmt of draft.stmts)
            lines.push(INDENT + stmt);
        
        for (const succ of draft.succs) {
            const label = succ.label ? ` [${succ.label}]` : '';
            
            lines.push(INDENT + EDGE + String(succ.id) + label);
        }
    }
    
    return lines.join('\n');
};

/**
 * The body of the first `FunctionDeclaration`. `/flow` shows one function,
 * so the printer ignores the other statements. The command layer reports
 * "no source" when there is no function.
 */
const bodyOf = (source: string): Node[] => {
    const ast = parse(source, parseOptions);
    const [first] = ast.program.body;
    
    if (first && first.type === 'FunctionDeclaration')
        return (first as unknown as {
            body: {
                body: Node[];
            };
        }).body.body;
    
    return ast.program.body;
};

/**
 * AST → flow text, always forward — same as `@putout/printer`.
 *
 * Parses the source, walks the body through the visitors, and formats the
 * blocks. Delegates by `node.type` and emits via `print(line)`; the block ids
 * are assigned here, never in a visitor, which is why the visitor contract
 * has no return value.
 */
export const print = (source: string): string => format(run(source, bodyOf(source)));
