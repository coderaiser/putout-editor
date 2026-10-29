import {z} from 'zod';
import {tryToCatch} from 'try-to-catch';
import {type ParserOptions, parse} from '@babel/parser';
import {text, errorText} from '@putout/editor-commands/content';
import {queryAST} from '@putout/editor-commands/query';
import {compactAST} from '@putout/editor-commands/compact';

export const name = 'parse';

export const description = 'Babel AST of JavaScript or TypeScript, compact. query: node types, returns their positions. full: the raw AST.';

export const schema = z.object({
    source: z
        .string()
        .describe('Source code'),
    query: z
        .string()
        .optional()
        .describe('Comma-separated node types, e.g. "Identifier"'),
    full: z
        .boolean()
        .optional()
        .default(false)
        .describe('Raw AST with loc and tokens'),
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
        return errorText(error);
    
    if (query)
        return text(JSON.stringify(queryAST(ast, query, source)));
    
    const output = full ? ast : compactAST(ast);
    
    return text(JSON.stringify(output));
}
