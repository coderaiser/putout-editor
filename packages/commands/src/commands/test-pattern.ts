import {tryToCatch} from 'try-to-catch';
import {
    print,
    putoutAsync,
    type types,
} from 'putout';
import type {ChatState, CommandResult} from '../state.types.ts';

type Vars = {
    [key: string]: types.Node;
};

const NO_MATCH = 'Nothing matched. A placeholder only takes a type from the shape around it, so "f(__a)" matches a call.';

/**
 * `/test-pattern` answers the three questions a pattern is asked before a rule
 * is written around it: does the key match, how many places, and what each
 * `__a` bound to. The replacement is rewritten to the key itself — it is only
 * ever run with `fix: false`, and a replacement that printed the binding would
 * be code that could not run.
 */
export const runTestPattern = async (args: string, state: ChatState): Promise<CommandResult> => {
    const {source} = state;
    
    if (!source)
        return {
            type: 'error',
            message: 'No source. Use /source first.',
        };
    
    if (!args)
        return {
            type: 'error',
            message: 'No pattern key. Put the key on the next line.',
        };
    
    const [error, data] = await tryToCatch(testKey, source, args);
    
    if (error)
        return {
            type: 'error',
            message: (error as Error).message,
        };
    
    return {
        type: 'text',
        data: data as string,
    };
};

async function testKey(fixture: string, key: string): Promise<string> {
    const bound: Record<string, string[]> = {};
    
    const {places} = await putoutAsync(fixture, {
        fix: false,
        plugins: [
            ['rule', {
                report: () => 'matched',
                match: () => ({
                    [key]: (vars: Vars = {}) => {
                        for (const [name, node] of Object.entries(vars))
                            bound[name] = [
                                ...bound[name] || [],
                                print(node),
                            ];
                        
                        return true;
                    },
                }),
                replace: () => ({
                    [key]: key,
                }),
            }],
        ],
    });
    
    if (!places.length)
        return NO_MATCH;
    
    const lines = [`${places.length} ${plural(places.length)}`];
    
    for (const [name, bindings] of Object.entries(bound))
        lines.push(`${name} → ${bindings.join(', ')}`);
    
    return lines.join('\n');
}

const plural = (count: number) => count === 1 ? 'match' : 'matches';
