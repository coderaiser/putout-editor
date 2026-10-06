import type {CommandResult} from '../state.types.ts';

/** The column the description starts in, so the list reads as two columns. */
const GAP = 2;

/**
 * The one list every other command's row is built from.
 *
 * `name` alone does not say how to *use* a command — a user who has not read
 * the source cannot tell that `source` takes code, that `find` takes a plugin,
 * or that `console` takes `off`. So each row carries a `usage` string naming
 * what follows the command name, in the brackets a shell would use, and `help`
 * prints it. That is the difference between a list of commands and an
 * instruction.
 *
 * `usage` is the *shape*, not the data: `source [source]` says the argument is
 * the source itself, and `[]` marks what is optional. A command that takes
 * nothing writes `[]`, which is why there is no second format to learn.
 */
export interface HelpRow {
    name: string;
    usage: string;
    description: string;
}

/**
 * `help` lists every command, built from the registry rather than written out
 * here — a command that is not listed is a command nobody finds, so the list and
 * the map cannot drift without `help.spec.ts` noticing.
 *
 * The name carries its leading `/`, because that is the spelling the page runs:
 * the chat sends only sigil-prefixed lines, so printing a bare name would teach
 * a line the page answers "Not a command".
 */
export const runHelp = (list: HelpRow[]): CommandResult => ({
    type: 'text',
    data: list
        .map(({name, usage, description}) => `${`/${name} ${usage}`.padEnd(widthOf(list))}${description}`)
        .join('\n'),
});

/** The widest `name + usage`, so every description starts in the same column. */
const widthOf = (list: HelpRow[]): number => Math.max(...list.map(({name, usage}) => `/${name} ${usage}`.length)) + GAP;
