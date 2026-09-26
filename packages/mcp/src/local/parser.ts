import {z} from 'zod';
import {tryToCatch} from 'try-to-catch';
import {type ParserOptions, parse} from '@babel/parser';
import {queryAST} from './query.ts';
import {compactAST} from './compact.ts';

export const name = 'parse';

export const description =
    'Parse JavaScript/TypeScript source and return its Babel AST in compact form ' +
    '(loc, tokens, comments stripped). Pass query with comma-separated node types ' +
    '(e.g. "VariableDeclaration") to return only matching node positions. ' +
    'Pass full=true to get the raw uncompacted AST.';

export const schema = z.object({
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
    full: z
        .boolean()
        .optional()
        .default(false)
        .describe('Return raw uncompacted AST including loc, tokens, comments. Defaults to false.'),
});

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

export async function handler({source, query, full}: z.input<typeof schema>) {
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
                text: JSON.stringify(nodes),
            }],
        };
    }
    
    const output = full ? ast : compactAST(ast);
    
    return {
        content: [{
            type: 'text' as const,
            text: JSON.stringify(output),
        }],
    };
}
