import {z} from 'zod';
import {tryToCatch} from 'try-to-catch';
import {request} from '../client.ts';

export const name = 'transform';

export const description =
    'Apply a putout plugin to source code and return the transformed result. ' +
    'Use find_places first to verify the plugin matches correctly, then call this to apply it.';

export const schema = {
    fixture: z
        .string()
        .describe('Source code to transform'),
    plugin: z
        .string()
        .describe('Putout plugin as an ESM string'),
};

export async function handler({fixture, plugin}: {fixture: string;plugin: string;}) {
    const [error, result] = await tryToCatch(request, '/api/v1/transform', {
        body: {
            fixture,
            plugin,
        },
        responseType: 'text',
    });
    
    if (error)
        return {
            content: [{
                type: 'text' as const,
                text: `Error: ${error.message}`,
            }],
        };
    
    // result is plain string — no JSON.stringify
    return {
        content: [{
            type: 'text' as const,
            text: result as string,
        }],
    };
}
