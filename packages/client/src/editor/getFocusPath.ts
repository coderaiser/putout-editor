function isInRange(range: [number, number], pos: number): boolean {
    return pos >= range[0] && pos <= range[1];
}

export function nodeToRange(parser: Parser, node: AstNode): Range {
    const range = parser.nodeToRange(node);
    
    if (range)
        return range;
    
    if (node.length && node.length > 0) {
        const first = node[0] as AstNode;
        const lastNode = node.at && node.at(-1) as AstNode;
        const rangeFirst = first && parser.nodeToRange(first);
        const rangeLast = lastNode && parser.nodeToRange(lastNode);
        
        if (rangeFirst && rangeLast)
            return [
                rangeFirst[0],
                rangeLast[1],
            ];
    }
}

export default function getFocusPath(node: AstNode, pos: number, parser: Parser, seen: Set<AstNode> = new Set()): AstNode[] {
    seen.add(node);
    
    let path: AstNode[] = [];
    const range = nodeToRange(parser, node);
    
    if (range) {
        const inside = isInRange(range, pos);
        
        if (inside)
            path.push(node);
        else
            return [];
    }
    
    for (const {value} of parser.forEachProperty(node)) {
        if (value && typeof value === 'object' && !seen.has(value as AstNode)) {
            let childPath = getFocusPath(value as AstNode, pos, parser, seen);
            
            if (childPath.length > 0) {
                if (!range)
                    childPath = [node].concat(childPath);
                
                path = path.concat(childPath);
                break;
            }
        }
    }
    
    return path;
}

type Range = [number, number] | undefined;

interface Parser {
    nodeToRange(node: AstNode): [number, number] | undefined;
    forEachProperty(node: AstNode): Iterable<{value: unknown}>;
}

interface AstNode {
    [key: string]: unknown;
    length?: number;
    at?: (index: number) => unknown;
}
