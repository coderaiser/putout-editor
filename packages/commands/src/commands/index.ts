import {runAst} from './ast.ts';
import {runFind} from './find.ts';
import {runTransform} from './transform.ts';
import {runSource} from './source.ts';
import {runTestPattern} from './test-pattern.ts';
import {runNamePattern} from './name-pattern.ts';
import {runValidate} from './validate.ts';
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

const listed: Command[] = [{
    name: 'source',
    description: 'set the source every other command reads',
    flags: [],
    run: runSource,
}, {
    name: 'ast',
    description: 'parse the source and show the tree',
    flags: [
        'full',
        'query',
    ],
    run: (args: string, state: ChatState, flags: Flags = {}) => runAst(flags, state),
}, {
    name: 'find',
    description: 'report where a plugin matches, changing nothing',
    flags: [],
    run: runFind,
}, {
    name: 'transform',
    description: 'apply a plugin once and show before and after',
    flags: [],
    run: runTransform,
}, {
    name: 'validate',
    description: 'check a plugin for syntax errors',
    flags: [],
    run: runValidate,
}, {
    name: 'test-pattern',
    description: 'does this key match, where, and what does each __a bind to',
    flags: [],
    run: runTestPattern,
}, {
    name: 'name-pattern',
    description: 'generalise a snippet into a pattern key',
    flags: [],
    run: runNamePattern,
}, {
    name: 'console',
    description: 'toggle the tree panel beside the chat',
    flags: [],
    run: (args: string) => runConsole(args !== 'off'),
}, {
    name: 'clear',
    description: 'clear the thread, keeping the source',
    flags: [],
    run: runClear,
}, {
    name: 'reset',
    description: 'clear the thread and empty the source',
    flags: [],
    run: runReset,
}, {
    name: 'help',
    description: 'list every command',
    flags: [],
    run: (): CommandResult => runHelp(listed),
}];

const entry = (command: Command): [string, Command] => [
    command.name,
    command,
];

export const commands: Map<string, Command> = new Map(listed.map(entry));
