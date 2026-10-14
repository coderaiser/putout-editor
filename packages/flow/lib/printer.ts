import {parse} from '@babel/parser';
import type {Node} from '@babel/parser';
import {visitBlock, visitIf} from './visitors/block.ts';
import {visitReturn} from './visitors/return.ts';

/** One edge out of a block. */
export interface Succ {
    id: number | 'exit';
    label?: string;
}

/** One basic block. */
export interface Block {
    id: number;
    stmts: string[];
    succs: Succ[];
    terminal?: true;
    unreachable?: true;
}

const INDENT = '  ';
const EDGE = '-> ';

/**
 * The state a visitor mutates: the blocks built so far, and the id of the
 * block the next statement will enter.
 */
export interface FlowState {
    /** The source the AST was parsed from, for slicing statements back out. */
    source: string;
    
    /** The blocks as they are built, in order. */
    blocks: Block[];
    
    /** The id of the block the next statement will enter. */
    nextId: number;
    
    /** The id of the block currently being filled. */
    current: number;
    
    /** The current block cannot take more statements. */
    closed: boolean;
}

const format = (blocks: Block[]): string => {
    const lines: string[] = [];

    for (const block of blocks) {
        lines.push(`block ${block.id}`);

        for (const stmt of block.stmts)
            lines.push(INDENT + stmt);

        for (const succ of block.succs)
            lines.push(INDENT + EDGE + String(succ.id));

        if (block.unreachable)
            lines.push('');
    }

    return lines.join('\n');
};

/**
 * `print` is the printer. It parses the source, walks the AST forward, and
 * calls the visitors — each of which appends a statement or an edge — then
 * formats the blocks.
 */
export const print = (source: string): string => {
    const ast = parse(source, {
        sourceType: 'module',
        strictMode: false,
        plugins: ['jsx', 'typescript'],
    }) as {program: {body: Node[]}};

    const blocks: Block[] = [];
    const state: FlowState = {
        source,
        blocks,
        nextId: 0,
        current: 0,
        closed: false,
    };

    const fn = ast.program.body[0] as Node;

    for (const child of fn.body)
        walk(child, state);

    return format(blocks);
};

const walk = (node: Node, state: FlowState): void => {
    switch (node.type) {
        case 'ReturnStatement':
            visitReturn(node, state);
            break;
        case 'BlockStatement':
            visitBlock(node, state);
            break;
        case 'IfStatement':
            visitIf(node, state);
            break;
    }
};

/**
 * Turn the internally built blocks into the text format.
 *
 * Kept separate from `print` so `findUnreachable` can be tested without
 * asserting on a string: the format is lossy, so a round-trip through
 * `parseOutput` cannot deep-equal.
 */
export const toOutput = (blocks: Block[]): string => {
    const lines: string[] = [];

    for (const block of blocks) {
        lines.push(`block ${block.id}`);

        for (const stmt of block.stmts)
            lines.push(INDENT + stmt);

        for (const succ of block.succs)
            lines.push(INDENT + EDGE + String(succ.id));

        if (block.unreachable)
            lines.push('');
    }

    return lines.join('\n');
};
