import type {CommandResult} from '../state.types.ts';

/**
 * `/help` lists every command, built from the registry rather than written out
 * here — a command that is not listed is a command nobody finds, so the list and
 * the map cannot drift without `help.spec.ts` noticing.
 */
export const runHelp = (list: {
    name: string;
    description: string;
}[]): CommandResult => ({
    type: 'text',
    data: list
        .map(({name, description}) => `/${name}  ${description}`)
        .join('\n'),
});
