import {tryCatch} from 'try-catch';

const STRIPPED_KEYS = new Set([
    'loc',
    'tokens',
    'comments',
    'extra',
    'innerComments',
    'leadingComments',
    'trailingComments',
    'start',
    'end',
]);

type ASTNode = Record<string, unknown>;

function compactNode(node: unknown): unknown {
    if (!node || typeof node !== 'object')
        return node;
    
    if (Array.isArray(node))
        return node
            .map(compactNode)
            .filter((child) => child !== null);
    
    const typed = node as ASTNode;
    
    if (!typed.type)
        return null;
    
    const result: ASTNode = {
        type: typed.type,
        start: typed.start,
        end: typed.end,
    };
    
    for (const [key, value] of Object.entries(typed)) {
        if (STRIPPED_KEYS.has(key))
            continue;
        
        if (!value || typeof value !== 'object') {
            result[key] = value;
            continue;
        }
        
        const compacted = compactNode(value);
        
        if (compacted !== null)
            result[key] = compacted;
    }
    
    return result;
}

export function compactAST(ast: unknown): unknown {
    const [error, result] = tryCatch(compactNode, ast);
    
    if (error)
        return ast;
    
    return result;
}
