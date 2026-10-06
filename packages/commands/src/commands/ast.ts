import {tryCatch} from 'try-catch';
import {type ParserOptions, parse} from '@babel/parser';
import {flattenAst} from '../flat.ts';
import {queryAST} from '../query.ts';
import type {Flags} from '../parse.ts';
import type {
    ChatState,
    CommandResult,
    FlatNode,
} from '../state.types.ts';

const parseOptions: ParserOptions = {
    sourceType: 'module',
    strictMode: false,
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    plugins: [
        'jsx',
        'typescript',
        'importMeta',
    ] as ParserOptions['plugins'],
};

/**
 * `ast` parses the current source into the rows the tree component renders.
 * `source` travels with the rows so `AstTree` has both without a second lookup,
 * and `--query` narrows to positions instead of the whole tree.
 */
export const runAst = (flags: Flags, state: ChatState): CommandResult => {
    const {source} = state;
    
    if (!source)
        return {
            type: 'error',
            message: 'No source. Use source first.',
        };
    
    const [error, ast] = tryCatch(parse, source, parseOptions);
    
    if (error)
        return {
            type: 'error',
            message: (error as Error).message,
        };
    
    const {query} = flags;
    
    if (isString(query)) {
        const matches = queryAST(ast, query, source);
        
        return {
            type: 'text',
            data: matches
                .map(({type, loc}) => `${type} at ${loc.start.line}:${loc.start.column}`)
                .join('\n'),
        };
    }
    
    const nodes: FlatNode[] = flattenAst(ast, source);
    
    return {
        type: 'ast',
        nodes,
        source,
    };
};

const isString = (value: unknown): value is string => typeof value === 'string';
