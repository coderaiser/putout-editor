import type {FlatNode} from './state.types.ts';

const isBool = (a: unknown): a is boolean => typeof a === 'boolean';
const isNumber = (a: unknown): a is number => !Number.isNaN(a) && typeof a === 'number';
const isString = (a: unknown): a is string => typeof a === 'string';

type Loc = {
    start: {
        line: number;
        column: number;
    };
    end: {
        line: number;
        column: number;
    };
};
type AstNode = {
    type?: string;
    name?: string;
    value?: unknown;
    loc?: Loc;
    start?: number | null;
    end?: number | null;
    [key: string]: unknown;
};

const isObject = (value: unknown): value is object => value as boolean && typeof value === 'object';

const isNode = (value: unknown): value is AstNode => isObject(value);

/** A node `walk` will render: an object with a `type` to show. */
const isTyped = (value: unknown): value is AstNode & {
    type: string;
} => isNode(value) && isString(value.type);

const quote = (value: string) => `"${value}"`;

const textOf = (node: AstNode, source: string): string => {
    if (!isNumber(node.start) || !isNumber(node.end))
        return '';
    
    return source
        .slice(node.start, node.end)
        .replace(/\s+/g, ' ')
        .trim();
};

/** Nodes whose own text says nothing useful on a row — the row is the type alone. */
const STRUCTURAL = new Set([
    'Program',
    'File',
    'BlockStatement',
    'ExpressionStatement',
    'ReturnStatement',
    'VariableDeclaration',
    'ObjectExpression',
    'ArrayExpression',
]);

/**
 * The maximum width of a row detail. A long detail pushes the type and
 * `line:col` off a narrow screen. A cut detail ends in `…`.
 */
const MAX_DETAIL = 32;

/**
 * Cut the finished detail, so the quotes count. The `…` is part of the
 * budget: a cut detail is exactly `MAX_DETAIL` columns.
 * `slice(0, -1)` is not the same: it removes only one character.
 */
const truncate = (value: string): string => value.length > MAX_DETAIL ? `${value.slice(0, MAX_DETAIL - 1)}…` : value;

/**
 * The value that says what a node is: a name, a literal value, a callee, or
 * else the source text (for a `MemberExpression`). A structural node gets `''`.
 */
function detailOf(node: AstNode & {
    type: string;
}, source: string): string {
    if (STRUCTURAL.has(node.type))
        return '';
    
    if (isString(node.name))
        return quote(node.name);
    
    if (isString(node.value))
        return quote(node.value);
    
    if (isNumber(node.value) || isBool(node.value))
        return String(node.value);
    
    if (isNode(node.callee) && isString(node.callee.name))
        return node.callee.name;
    
    return textOf(node, source);
}

export function flattenAst(ast: unknown, source: string): FlatNode[] {
    const result: FlatNode[] = [];
    
    walk(rootOf(ast), {
        pid: null,
        depth: 0,
        key: '',
    }, source, result);
    
    return result;
}

/**
 * `@babel/parser` wraps everything in a `File` node, which is not something the
 * tree shows — the row a reader sees first is `Program`, so the wrapper is
 * dropped and the body walked directly. A bare node is returned as it is.
 */
function rootOf(ast: unknown): unknown {
    if (!isNode(ast) || ast.type !== 'File')
        return ast;
    
    return ast.program;
}

interface Position {
    pid: string | null;
    depth: number;
    key: string;
}

/** Where a child sits: its parent, its depth, and the key that holds it. */
const childOf = (pid: string, depth: number, key: string): Position => ({
    pid,
    depth: depth + 1,
    key,
});

function walk(node: unknown, {pid, depth, key}: Position, source: string, result: FlatNode[]): void {
    if (!isTyped(node))
        return;
    
    const {loc} = node;
    
    if (!loc)
        return;
    
    const id = String(result.length);
    
    result.push({
        id,
        pid,
        depth,
        key,
        type: node.type,
        detail: truncate(detailOf(node, source)),
        line: loc.start.line,
        col: loc.start.column,
        endLine: loc.end.line,
        endCol: loc.end.column,
    });
    
    for (const [name, value] of Object.entries(node)) {
        if (Array.isArray(value)) {
            for (const [index, child] of value.entries()) {
                const position = childOf(id, depth, `${name}[${index}]`);
                
                walk(child, position, source, result);
            }
            
            continue;
        }
        
        walk(value, childOf(id, depth, name), source, result);
    }
}
