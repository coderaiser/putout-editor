import type {FlatNode} from '@putout/editor-commands';

export const node = (id: string, pid: string | null, depth: number, type = 'Node', detail = ''): FlatNode => ({
    id,
    pid,
    depth,
    key: '',
    type,
    detail,
    line: 1,
    col: 0,
    endLine: 1,
    endCol: 1,
});

/**
 * `[...set].sort()` is what puts a Set's members in a stable order for an
 * assertion, and it is a fixed point for putout: `spread/remove-useless-array`
 * rewrites it to `set.sort()`, which does not exist, and
 * `tape/extract-result-from-assertion` then pulls the whole expression out of
 * the spec. A named helper is the way out.
 */
export const sorted = (ids: Set<string>) => [...ids].sort();

export const idsOf = (rows: FlatNode[]) => {
    const ids: string[] = [];
    
    for (const {id} of rows)
        ids.push(id);
    
    return ids;
};

export const program = () => node('0', null, 0, 'Program');
export const declaration = () => node('1', '0', 1, 'VariableDeclaration');
export const declarator = () => node('2', '1', 2, 'VariableDeclarator');
export const identifier = () => node('3', '2', 3, 'Identifier', '"a"');
export const numeric = () => node('4', '1', 2, 'NumericLiteral', '1');

/**
 * What a query matches on an AST row, the same accessor `AstTree` passes.
 *
 * Every `rowsOf` / `filterNodes` call takes it, because the hook does not
 * know which tree it is serving — `LearnTree` matches on a label and a summary.
 */
export const textOf = (node: FlatNode) => `${node.type} ${node.detail}`;

/**
 *     Program
 *     - VariableDeclaration
 *       - VariableDeclarator
 *         - Identifier
 *       - NumericLiteral
 */
export const tree: FlatNode[] = [
    program(),
    declaration(),
    declarator(),
    identifier(),
    numeric(),
];
