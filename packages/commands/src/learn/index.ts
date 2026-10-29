import {curriculum} from './curriculum.ts';
import type {Command, CommandResult} from '../state.types.ts';

/**
 * `/learn` — the whole curriculum, every time.
 *
 * Takes no args and no state, unlike `ast` which reads the buffer: a concept
 * tree has nothing to read *from*. It answers with the nested tree rather than
 * flattened rows, because the rows are derived from it wherever they are drawn —
 * sending both would send the same tree twice.
 *
 * The plan names this `runLearn(): CommandResult`, and the registry entry is
 * what makes it reachable. `usage: '[]'` rather than omitting it, which is the
 * convention `help`'s rows follow so no command is ambiguous about whether it
 * takes an argument.
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
