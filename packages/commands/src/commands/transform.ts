import {tryToCatch} from 'try-to-catch';
import {putoutAsync} from 'putout';
import {compilePlugin} from '../plugin.ts';
import type {ChatState, CommandResult} from '../state.types.ts';

/**
 * `transform` applies the plugin once and returns the before and after, so the
 * message can show a diff. An unchanged transform still returns both strings —
 * equal — because "it did nothing" is an answer, not a failure.
 */
export const runTransform = async (args: string, state: ChatState): Promise<CommandResult> => {
    const {source} = state;
    
    if (!source)
        return {
            type: 'error',
            message: 'No source. Use source first.',
        };
    
    if (!args)
        return {
            type: 'error',
            message: 'No plugin. Put the plugin on the next line.',
        };
    
    const [error, after] = await tryToCatch(transform, source, args);
    
    if (error)
        return {
            type: 'error',
            message: (error as Error).message,
        };
    
    return {
        type: 'transform',
        before: source,
        after: after as string,
    };
};

async function transform(fixture: string, plugin: string): Promise<string> {
    const compiled = compilePlugin(plugin);
    const {code} = await putoutAsync(fixture, {
        fixCount: 1,
        plugins: [
            ['rule', compiled],
        ],
    });
    
    return code.trimEnd();
}
