import {tryToCatch} from 'try-to-catch';
import {putoutAsync} from 'putout';
import {compilePlugin} from '../plugin.ts';
import type {
    ChatState,
    CommandResult,
    Place,
} from '../state.types.ts';

/**
 * `/find` runs the plugin over the current source and reports where it matched,
 * changing nothing. A plugin that matches nowhere is a result with zero places,
 * not an error — "no matches" is the answer the user asked for.
 */
export const runFind = async (args: string, state: ChatState): Promise<CommandResult> => {
    const {source} = state;
    
    if (!source)
        return {
            type: 'error',
            message: 'No source. Use /source first.',
        };
    
    if (!args)
        return {
            type: 'error',
            message: 'No plugin. Put the plugin on the next line.',
        };
    
    const [error, places] = await tryToCatch(findPlaces, source, args);
    
    if (error)
        return {
            type: 'error',
            message: (error as Error).message,
        };
    
    return {
        type: 'places',
        data: places,
    };
};

async function findPlaces(fixture: string, plugin: string): Promise<Place[]> {
    const compiled = compilePlugin(plugin);
    const {places} = await putoutAsync(fixture, {
        fix: false,
        plugins: [
            ['rule', compiled],
        ],
    });
    
    return places as Place[];
}
