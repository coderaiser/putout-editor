export {compactAST} from './compact.ts';
export {queryAST} from './query.ts';

/**
 * Do not export `compilePlugin` here: its module loads 🐊Putout, which cannot
 * run in a browser. Import it from `@putout/editor-commands/plugin`.
 * `type Rule` costs nothing at runtime.
 */
export type {Rule} from './plugin.ts';
export {flattenAst} from './flat.ts';

/**
 * `curriculum` and `flattenLearn` are here for the same reason `flattenAst` is:
 * both are pure and the chat imports them. `curriculum` is a data literal with
 * no `createRequire` and no `fs`, so it is safe in a browser bundle — the
 * `compilePlugin` note above is what keeps the modules that are *not* safe out.
 */
export {
    curriculum,
    findLearnNode,
    learnNodes,
} from './learn/curriculum.ts';
export {flattenLearn} from './learn/flat.ts';
export {runLearn} from './learn/index.ts';
export {
    parseCommand,
    type ParsedCommand,
    type ParseError,
    type Flags,
} from './parse.ts';
export {
    text,
    errorText,
    type ToolResult,
} from './content.ts';
export type {
    ChatState,
    Command,
    CommandResult,
    FlatLearnNode,
    FlatNode,
    LearnNode,
    Place,
} from './state.types.ts';
export {
    commands,
    notInBrowser,
    needsPutout,
} from './commands/index.ts';

/**
 * This barrel exports no React components: this package is a Node library.
 * The tree components are in `packages/chat/src/components/`.
 * `runFind`, `runTransform` and `runValidate` load 🐊Putout: import each from
 * its own file, for example `@putout/editor-commands/commands/validate`.
 */
export {runAst} from './commands/ast.ts';
export {runSource} from './commands/source.ts';
export {runTestPattern} from './commands/test-pattern.ts';
export {runNamePattern} from './commands/name-pattern.ts';
export {runHelp} from './commands/help.ts';
export {runClear} from './commands/clear.ts';
export {runReset} from './commands/reset.ts';
export {runConsole} from './commands/console.ts';
