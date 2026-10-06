import type {CommandResult} from '../state.types.ts';

/** `console` toggles the tree panel; the message says which way it went. */
export const runConsole = (open: boolean): CommandResult => ({
    type: 'text',
    data: open ? 'Console opened' : 'Console closed',
});
