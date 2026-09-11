const isNumber = (value: unknown): value is number => !Number.isNaN(value) && typeof value === 'number';
const trim = (type: string) => type.trim();

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
    text: string;
};
type ASTNode = {
    type?: string;
    start?: number;
    end?: number;
    loc?: NodeLocation;
    [key: string]: unknown;
};

const byStart = (first: QueryMatch, second: QueryMatch) => first.start - second.start;

function walkAST(node: unknown, nodeTypes: Set<string>, results: QueryMatch[], source: string): void {
    if (!node || typeof node !== 'object')
        return;
    
    if (Array.isArray(node)) {
        for (const child of node)
            walkAST(child, nodeTypes, results, source);
        
        return;
    }
    
    const typed = node as ASTNode;
    
    if (typed.type && nodeTypes.has(typed.type) && isNumber(typed.start) && typeof typed.end === 'number' && typed.loc)
        results.push({
            type: typed.type,
            start: typed.start,
            end: typed.end,
            loc: typed.loc,
            text: source.slice(typed.start, typed.end),
        });
    
    for (const value of Object.values(typed))
        walkAST(value, nodeTypes, results, source);
}

export function queryAST(ast: unknown, query: string, source: string): QueryMatch[] {
    const nodeTypes = new Set(query
        .split(',')
        .map(trim)
        .filter(Boolean));
    
    const results: QueryMatch[] = [];
    
    walkAST(ast, nodeTypes, results, source);
    
    return results.sort(byStart);
}
