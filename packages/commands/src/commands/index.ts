import {tryToCatch} from 'try-to-catch';
import {runAst} from './ast.ts';
import {runSource} from './source.ts';
import {runTestPattern} from './test-pattern.ts';
import {runNamePattern} from './name-pattern.ts';
import {runHelp} from './help.ts';
import {runClear} from './clear.ts';
import {runReset} from './reset.ts';
import {runConsole} from './console.ts';
import type {Flags} from '../parse.ts';
import type {
    ChatState,
    Command,
    CommandResult,
} from '../state.types.ts';

/**
 * The three commands that need 🐊**Putout** are **lazily** loaded.
 *
 * `find`, `transform` and `validate` reach `compilePlugin` → `redput` →
 * `putout`, and `putout` cannot be bundled for a browser: it reads a config
 * file through `cosmiconfig`, resolves plugins with `globby`, and its own rule
 * set calls `os.homedir()` at module scope. Importing any of the three
 * statically therefore breaks the whole page — `/ast` and `/source` would go
 * down with them, and they are the ones the chat is for.
 *
 * A dynamic `import()` puts them in their own chunk, so the page loads without
 * them and a user who types `/find` gets that chunk or an error — never a blank
 * screen for the commands that do work. The trade is stated here because it is a
 * real one: in a browser these three report that they need the server, rather
 * than running.
 */
export const notInBrowser = (name: string): CommandResult => ({
    type: 'error',
    message: `${name} needs the putout server and does not run in the browser.`,
});

type Runner = Command['run'];

/**
 * Exported for the same reason as `notInBrowser`: both of its guards are
 * unreachable in a browser — a chunk either loads or it does not, and the
 * export it was asked for is either there or it is not — so they are only
 * reachable by calling this directly.
 */
export const needsPutout = (name: string, exportName: string, load: () => Promise<Record<string, Runner>>) => async (args: string, state: ChatState): Promise<CommandResult> => {
    const [error, module] = await tryToCatch(load);
    
    if (error)
        return notInBrowser(name);
    
    const run = module[exportName];
    
    if (!run)
        return notInBrowser(name);
    
    // `Command.run` is `(args, state)` — the registry's `/ast` entry reads its
    // own flags, so there is no third argument to pass here either.
    return run(args, state);
};

const listed: Command[] = [{
    name: 'source',
    usage: '[source]',
    description: 'set the source every other command reads',
    flags: [],
    run: runSource,
}, {
    name: 'ast',
    usage: '[--full] [--query type]',
    description: 'parse the source and show the tree',
    flags: [
        'full',
        'query',
    ],
    run: (args: string, state: ChatState, flags: Flags = {}) => runAst(flags, state),
}, {
    name: 'find',
    usage: '[plugin]',
    description: 'report where a plugin matches, changing nothing',
    flags: [],
    run: needsPutout('find', 'runFind', async () => await import('./find.ts')),
}, {
    name: 'transform',
    usage: '[plugin]',
    description: 'apply a plugin once and show before and after',
    flags: [],
    run: needsPutout('transform', 'runTransform', async () => await import('./transform.ts')),
}, {
    name: 'validate',
    usage: '[plugin]',
    description: 'check a plugin for syntax errors',
    flags: [],
    run: needsPutout('validate', 'runValidate', async () => await import('./validate.ts')),
}, {
    name: 'test-pattern',
    usage: '[key]',
    description: 'does this key match, where, and what does each __a bind to',
    flags: [],
    run: runTestPattern,
}, {
    name: 'name-pattern',
    usage: '[snippet]',
    description: 'generalise a snippet into a pattern key',
    flags: [],
    run: runNamePattern,
}, {
    name: 'console',
    usage: '[off]',
    description: 'toggle the tree panel beside the chat',
    flags: [],
    run: (args: string) => runConsole(args !== 'off'),
}, {
    name: 'clear',
    usage: '[]',
    description: 'clear the thread, keeping the source',
    flags: [],
    run: runClear,
}, {
    name: 'reset',
    usage: '[]',
    description: 'clear the thread and empty the source',
    flags: [],
    run: runReset,
}, {
    name: 'help',
    usage: '[]',
    description: 'list every command',
    flags: [],
    run: (): CommandResult => runHelp(listed),
}];

const entry = (command: Command): [string, Command] => [
    command.name,
    command,
];

export const commands: Map<string, Command> = new Map(listed.map(entry));
