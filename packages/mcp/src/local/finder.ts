import {z} from 'zod';
import {tryToCatch} from 'try-to-catch';
import {putoutAsync} from 'putout';
import {compilePlugin} from './plugin.ts';

export const name = 'find_places';

export const description =
    'Find all places where a putout plugin matches in source code, without modifying it. ' +
    'Returns matches with rule name, message, and line/column position. ' +
    'Typical loop: write plugin → find_places → fix → repeat → transform.';

export const schema = {
    fixture: z
        .string()
        .describe('Source code to search for matches'),
    plugin: z
        .string()
        .describe(
            'Putout plugin as an ESM string. Must export report and one of: replace, traverse, include. ' +
        'Example: export const report = () => "use const"; ' +
        'export const replace = () => ({ "var __x = __y": "const __x = __y" });',
        ),
};

export async function handler({fixture, plugin}: {fixture: string;plugin: string;}) {
    const [error, result] = await tryToCatch(runFindPlaces, fixture, plugin);
    
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

async function runFindPlaces(fixture: string, plugin: string) {
    const compiledRule = compilePlugin(plugin);
    const result = await putoutAsync(fixture, {
        fix: false,
        plugins: [
            ['rule', compiledRule],
        ],
    });
    
    return {
        places: result.places,
    };
}
