import {z} from 'zod';
import {tryToCatch} from 'try-to-catch';
import {request} from '../client.ts';

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

export async function handler({source, query}: {source: string;query?: string;}) {
    const path = query
        ? `/api/v1/parse?query=${encodeURIComponent(query)}`
        : '/api/v1/parse';
    
    const [error, result] = await tryToCatch(request, path, {
        body: {
            source,
        },
    });
    
    if (error)
        return {
            content: [{
                type: 'text' as const,
                text: `Error: ${error.message}`,
            }],
        };
    
    return {
        content: [{
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
        }],
    };
}
