import {tryCatch} from 'try-catch';
import {compilePlugin} from '../plugin.ts';
import type {CommandResult} from '../state.types.ts';

/**
 * `validate` compiles a plugin and reports whether it parses, which needs no
 * source at all — the check to run before `find_places`, so a typo in the rule
 * is not mistaken for a rule that does not match.
 */
export const runValidate = (args: string): CommandResult => {
    if (!args)
        return {
            type: 'error',
            message: 'No plugin. Put the plugin on the next line.',
        };
    
    const [error] = tryCatch(compilePlugin, args);
    
    if (error)
        return {
            type: 'error',
            message: (error as Error).message,
        };
    
    return {
        type: 'text',
        data: 'ok',
    };
};
