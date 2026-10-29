import type {CommandResult} from '../state.types.ts';

/** The column the description starts in, so the list reads as two columns. */
const GAP = 2;

/**
 * A `help` row. `usage` names what follows the command, in shell brackets:
 * `source [source]`. `[]` marks an optional part, or no argument.
 */
export interface HelpRow {
    name: string;
    usage: string;
    description: string;
}

/**
 * `help` lists the registry, so the list and the map cannot differ.
 * Each name has its leading `/`: the chat runs only lines with the sigil.
 */
export const runHelp = (list: HelpRow[]): CommandResult => ({
    type: 'text',
    data: list
        .map(({name, usage, description}) => `${`/${name} ${usage}`.padEnd(widthOf(list))}${description}`)
        .join('\n'),
});

/** The widest `name + usage`, so every description starts in the same column. */
const widthOf = (list: HelpRow[]): number => Math.max(...list.map(({name, usage}) => `/${name} ${usage}`.length)) + GAP;
