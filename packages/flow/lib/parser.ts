/**
 * One edge out of a block.
 *
 * `id` is a block number or the literal `'exit'`, and `label` is the printer's
 * `[true]` / `[false]` annotation on a conditional branch — present only where
 * the branch is conditional, because a fall-through edge has nothing to say.
 */
export interface Succ {
    id: number | 'exit';
    label?: string;
}

/**
 * One basic block.
 *
 * `stmts` are **source strings**, never IR: the text is what a reader compares
 * against the editor and what an LLM reads in an answer, and re-deriving source
 * from an IR would mean shipping a printer's worth of decisions in this type.
 *
 * `terminal` means the block cannot fall through — it holds a `return` and its
 * only successor is `exit`. It is **inferred here** rather than parsed, so the
 * text stays the printer's and the property stays one line to change.
 *
 * `unreachable` is the printer's annotation of code no path reaches.
 */
export interface Block {
    id: number;
    stmts: string[];
    succs: Succ[];
    terminal?: true;
    unreachable?: true;
}

const INDENT = '  ';
const EDGE = '-> ';
const HEADER = /^block (\d+)( \[unreachable\])?$/;

const trim = (line: string): string => line.trim();

const isEdge = (line: string): boolean => line.startsWith(INDENT) && trim(line).startsWith(EDGE);

/**
 * `  -> 2 [false]` into `{id: 2, label: 'false'}`.
 *
 * `exit` stays a string and everything else becomes a number, which is the one
 * place the format's two id kinds are told apart — and the reason `Succ.id` is
 * a union rather than a `number` with a sentinel.
 */
const toSucc = (line: string): Succ => {
    const [, target, label] = trim(line).match(/^-> (\S+)(?: \[([^\]]+)\])?$/) || [];
    const succ: Succ = {
        id: target === 'exit' ? 'exit' : Number(target),
    };
    
    if (label)
        succ.label = label;
    
    return succ;
};

/** Whether this block holds a `return` and its only way out is `exit`. */
const isTerminal = (stmts: string[], succs: Succ[]): boolean => {
    const onlyExit = succs.length === 1 && succs[0].id === 'exit';
    
    const hasReturn = (stmt: string) => stmt.startsWith('return');
    
    return onlyExit && stmts.some(hasReturn);
};

/**
 * Flow text back into blocks — the inverse of `printer.ts`.
 *
 * Kept as its own file and never merged with the printer, for the same reason
 * the two halves of any format are separate: a round-trip that shares code
 * between writer and reader is a round-trip that cannot fail, and
 * `index.spec.ts` depends on this one being able to disagree.
 *
 * The grammar is line-based and needs no state beyond the block being filled:
 * a `block N` header starts one, an indented `->` line appends an edge, and any
 * other indented line is a statement. Blank lines separate blocks and are
 * otherwise ignored, so trailing newlines are not a special case.
 */
export const parse = (text: string): Block[] => {
    const chunks = text
        .split(/\n\s*\n/)
        .map(trim)
        .filter(Boolean);
    
    const blocks: Block[] = [];
    
    for (const chunk of chunks) {
        const [header, ...rest] = chunk.split('\n');
        
        const matched = HEADER.exec(header);
        
        if (!matched)
            continue;
        
        const [, id, unreachable] = matched;
        const stmts: string[] = [];
        const succs: Succ[] = [];
        
        for (const line of rest) {
            if (isEdge(line)) {
                succs.push(toSucc(line));
                
                continue;
            }
            
            if (line.startsWith(INDENT))
                stmts.push(trim(line));
        }
        
        const block: Block = {
            id: Number(id),
            stmts,
            succs,
        };
        
        if (unreachable)
            block.unreachable = true;
        
        if (isTerminal(stmts, succs))
            block.terminal = true;
        
        blocks.push(block);
    }
    
    return blocks;
};
