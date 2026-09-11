import {z} from 'zod';
import {tryToCatch} from 'try-to-catch';
import {type ParserOptions, parse} from '@babel/parser';
import {queryAST} from './query.ts';

export const name = 'parse';

export const description =
    'Parse JavaScript/TypeScript source and return its Babel AST. ' +
    'Pass query with a comma-separated list of node types (e.g. "VariableDeclaration") ' +
    'to return only matching node positions instead of the full AST. ' +
    'Use this before writing a plugin to identify the node types to target.';

export const schema = {
    source: z
        .string()
        .describe('JavaScript or TypeScript source code to parse'),
    query: z
        .string()
        .optional()
        .describe(
            'Comma-separated Babel node types, e.g. "VariableDeclaration,Identifier". ' +
        'When set, returns node positions instead of the full AST.',
        ),
};

const parseOptions: ParserOptions = {
    sourceType: 'module',
    strictMode: false,
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    plugins: [
        'jsx',
        'typescript',
        'importMeta',
    ],
};

export async function handler({source, query}: {source: string;query?: string;}) {
    const [error, ast] = await tryToCatch(parse, source, parseOptions);
    
    if (error)
        return {
            content: [{
                type: 'text' as const,
                text: `Error: ${error.message}`,
            }],
        };
    
    if (query) {
        const nodes = queryAST(ast, query, source);
        
        return {
            content: [{
                type: 'text' as const,
                text: JSON.stringify(nodes, null, 2),
            }],
        };
    }
    
    return {
        content: [{
            type: 'text' as const,
            text: JSON.stringify(ast, null, 2),
        }],
    };
}
