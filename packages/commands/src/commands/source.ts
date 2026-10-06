import type {CommandResult} from '../state.types.ts';

/**
 * `source` sets the buffer every other command reads. No argument is an empty
 * source, not an error — clearing the buffer is a thing a user does on purpose.
 */
export const runSource = (args: string): CommandResult => ({
    type: 'source',
    data: args,
});
