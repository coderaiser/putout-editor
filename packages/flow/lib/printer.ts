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
 * One block under construction: statements and edges so far, plus whether it
 * ended in a terminator.
 *
 * `done` is the printer's half of the `terminated()` / `closed()` contract —
 * the visitors report edges, the printer remembers which block they closed.
 * It is separate from `terminal` (the parser's inference, step 8's
 * round-trip) because the printer *knows* a block ended in `return` while the
 * text only *shows* it.
 */
interface Draft {
    id: number;
    stmts: string[];
    succs: Succ[];
    done: boolean;
    unreachable: boolean;
}

/**
 * The `FlowApi` contract, backed by real blocks.
 *
 * `at` is the block `print` appends to and `edge` leaves from — reselected by
 * every call that opens a block, which is why `branch()` returns the id it
 * selected rather than just opening one. `walk` is the same dispatch the top
 * level runs, so a nested `if` reaches `visitIf` through the arm that
 * contains it.
 *
 * `merge()` edges every unterminated arm into the fresh join and selects it;
 * terminated arms already edge to `exit`, so wiring them again would draw an
 * edge the program cannot take. `mergeUnreachable()` selects the same join
 * with no edges at all — by its contract, every arm terminated, so nothing
 * falls through.
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
 * A draft into the plan's text format — the only `Block` construction in the
 * package that is not the parser's.
 *
 * Blocks are separated by one blank line, and only unreachable blocks keep a
 * trailing one: the parser splits on `\n\s*\n`, so the blank is the separator
 * everywhere and the `[unreachable]` header needs no extra help reaching the
 * next block. Edges carry their `[true]` / `[false]` labels; the fall-through
 * `merge()` wrote has none, because a join edge has nothing to say.
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
 * The one `FunctionDeclaration` the package handles, unwrapped to its body.
 *
 * `/flow` graphs one function — the source panel highlights its lines, the
 * SVG draws its blocks — so a second top-level statement has nowhere to go on
 * either side. The printer takes the first function and ignores the rest
 * rather than erroring, because the command layer reports "no source" for the
 * empty case and this keeps one error path instead of two.
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
