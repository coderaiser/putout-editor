import type {CommandResult} from '../state.types.ts';

/**
 * `clear` empties the transcript and keeps the source and plugin: the two
 * distinct resets the plan asks for, so a user can start a new question
 * without re-pasting.
 */
export const runClear = (): CommandResult => ({
    type: 'text',
    data: '',
});
