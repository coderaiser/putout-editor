import {z} from 'zod';
import {tryCatch} from 'try-catch';
import {compilePlugin} from './plugin.ts';

export const name = 'validate';

export const description =
    'Check a putout plugin string for syntax errors without needing source code. ' +
    'Returns "ok" on success or an error message with line and column. ' +
    'Call this after writing or editing a plugin before calling find_places.';

export const schema = z.object({
    plugin: z
        .string()
        .describe('Putout plugin as an ESM string to validate'),
});

export function handler({plugin}: z.infer<typeof schema>) {
    const [error] = tryCatch(compilePlugin, plugin);
    
    if (error)
        return {
            content: [{
                type: 'text' as const,
                text: (error as Error).message,
            }],
        };
    
    return {
        content: [{
            type: 'text' as const,
            text: 'ok',
        }],
    };
}