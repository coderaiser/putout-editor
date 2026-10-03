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
 * The one value that says what a node *is*, so a row can be read without
 * opening it: a name, a literal value, a call's callee, and — failing all
 * three — the node's own text in the source, which is what a `MemberExpression`
 * wants. A structural node gets `''`, since the type already says everything.
 *
 * `walk` has already established that `node.type` is a string by the time a
 * node reaches here, so it is read as one rather than guarded.
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
    
    walk(rootOf(ast), null, 0, source, result);
    
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

function walk(node: unknown, pid: string | null, depth: number, source: string, result: FlatNode[]): void {
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
        type: node.type,
        detail: detailOf(node, source),
        line: loc.start.line,
        col: loc.start.column,
        endLine: loc.end.line,
        endCol: loc.end.column,
    });
    
    for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
            for (const child of value)
                walk(child, id, depth + 1, source, result);
            
            continue;
        }
        
        walk(value, id, depth + 1, source, result);
    }
}
