import type {CommandResult} from '../state.types.ts';

/** `/reset` is `/clear` plus an empty source and plugin. */
export const runReset = (): CommandResult => ({
    type: 'text',
    data: 'Reset',
});
