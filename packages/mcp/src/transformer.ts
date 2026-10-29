import {z} from 'zod';
import {tryToCatch} from 'try-to-catch';
import {putoutAsync} from 'putout';
import {text, errorText} from '@putout/editor-commands/content';
import {compilePlugin} from '@putout/editor-commands/plugin';
import {resolveTS} from './language.ts';

export const name = 'transform';

export const description = 'Run a putout plugin on a fixture and return the code.';

export const schema = z.object({
    fixture: z
        .string()
        .describe('Source code'),
    plugin: z
        .string()
        .describe('Plugin source (ESM)'),
    isTS: z
        .boolean()
        .optional()
        .describe('TypeScript fixture. Omit: found from the fixture'),
});

export async function handler({fixture, plugin, isTS}: z.input<typeof schema>) {
    const [error, result] = await tryToCatch(runTransform, fixture, plugin, isTS);
    
    if (error)
        return errorText(error);
    
    return text(result as string);
}

async function runTransform(fixture: string, plugin: string, isTS?: boolean) {
    const compiledRule = compilePlugin(plugin);
    const result = await putoutAsync(fixture, {
        isTS: resolveTS(fixture, isTS),
        fixCount: 1,
        plugins: [
            ['rule', compiledRule],
        ],
    });
    
    return result.code.trimEnd();
}
