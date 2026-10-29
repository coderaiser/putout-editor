import {curriculum} from './curriculum.ts';
import type {Command, CommandResult} from '../state.types.ts';

/**
 * `/learn` returns the whole curriculum as a tree. No args and no state.
 * The view makes the rows. `usage: '[]'` like the other `help` rows.
 */
export const runLearn = (): CommandResult => ({
    type: 'learn',
    tree: curriculum,
});

export const learnCommand: Command = {
    name: 'learn',
    usage: '[]',
    description: 'browse the putout concept tree',
    flags: [],
    run: runLearn,
};
