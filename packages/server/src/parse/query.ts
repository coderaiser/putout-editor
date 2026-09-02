const isNumber = (a) => !Number.isNaN(a) && typeof a === 'number';

type Position = {
    line: number;
    column: number;
};
type NodeLocation = {
    start: Position;
    end: Position;
};
type QueryMatch = {
    type: string;
    start: number;
    end: number;
    loc: NodeLocation;
};
type ASTNode = {
    type?: string;
    start?: number;
    end?: number;
    loc?: NodeLocation;
    [key: string]: unknown;
};

function walkAST(node: unknown, nodeTypes: Set<string>, results: QueryMatch[]): void {
    if (!node || typeof node !== 'object')
        return;
    
    if (Array.isArray(node)) {
        for (const child of node)
            walkAST(child, nodeTypes, results);
        
        return;
    }
    
    const typed = node as ASTNode;
    
    if (typed.type && nodeTypes.has(typed.type) && isNumber(typed.start) && typeof typed.end === 'number' && typed.loc)
        results.push({
            type: typed.type,
            start: typed.start,
            end: typed.end,
            loc: typed.loc,
        });
    
    for (const value of Object.values(typed))
        walkAST(value, nodeTypes, results);
}

export function queryAST(ast: unknown, query: string): QueryMatch[] {
    const nodeTypes = new Set(query
        .split(',')
        .map((type) => type.trim())
        .filter(Boolean));
    
    const results: QueryMatch[] = [];
    
    walkAST(ast, nodeTypes, results);
    
    return results.sort((first, second) => first.start - second.start);
}
