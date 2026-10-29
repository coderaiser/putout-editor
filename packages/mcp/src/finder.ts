import {z} from 'zod';
import {tryToCatch} from 'try-to-catch';
import {putoutAsync} from 'putout';
import {text, errorText} from '@putout/editor-commands/content';
import {compilePlugin} from '@putout/editor-commands/plugin';
import {resolveTS} from './language.ts';

export const name = 'find_places';

export const description = 'Places a putout plugin reports in a fixture. Does not change the code.';

export const schema = z.object({
    fixture: z
        .string()
        .describe('Source code'),
    plugin: z
        .string()
        .describe('Plugin source (ESM): report, then replace, traverse, include, scan or declare'),
    isTS: z
        .boolean()
        .optional()
        .describe('TypeScript fixture. Omit: found from the fixture'),
});

export async function handler({fixture, plugin, isTS}: z.input<typeof schema>) {
    const [error, result] = await tryToCatch(runFindPlaces, fixture, plugin, isTS);
    
    if (error)
        return errorText(error);
    
    return text(JSON.stringify(result));
}

async function runFindPlaces(fixture: string, plugin: string, isTS?: boolean) {
    const compiledRule = compilePlugin(plugin);
    const result = await putoutAsync(fixture, {
        isTS: resolveTS(fixture, isTS),
        fix: false,
        plugins: [
            ['rule', compiledRule],
        ],
    });
    
    return {
        places: result.places,
    };
}
