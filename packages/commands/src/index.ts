export {compactAST} from './compact.ts';
export {queryAST} from './query.ts';

/**
 * `compilePlugin` is deliberately **not** re-exported here.
 *
 * It is a value, and its module calls `createRequire(import.meta.url)` at the
 * top level — which drags in `redput` and 🐊**Putout**, and 🐊**Putout** cannot
 * be bundled for a browser at all. A barrel export is enough to put it in the
 * graph, so any consumer that only wants the parser, the tree or the commands
 * would carry it: `packages/chat` imports this file, and with the export in
 * place the page loaded a chunk that called `os.homedir()` at module scope and
 * rendered nothing.
 
 * The mcp imports it from `@putout/editor-commands/plugin`, which is the
 * subpath that costs the same import and is only paid by a consumer that
 * actually compiles a plugin. `type Rule` stays, because a type costs nothing
 * at runtime.
 */
export type {Rule} from './plugin.ts';
export {flattenAst} from './flat.ts';
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
    FlatNode,
    Place,
} from './state.types.ts';
export {
    commands,
    notInBrowser,
    needsPutout,
} from './commands/index.ts';

/**
 * No React components are exported here. The AST tree — `AstTree`, `AstRow`,
 * `AstSearch`, `AstCodePreview`, `AstStatus` and `useTreeState` — lives in
 * `packages/chat/src/components/`, because this package is a Node library: the
 * mcp uses the commands and has no DOM. `jsx: true` stays in this package's test
 * env so a spec can still import a component *by path* when it needs to; nothing
 * re-exports one, so nothing a Node consumer loads can pull React in.
 *
 * `compilePlugin` is gone from the barrel for a different reason, and that one
 * is about 🐊**Putout** rather than React: it is a value whose module calls
 * `createRequire(import.meta.url)` at the top level, so any consumer importing
 * this file carried 🐊**Putout** with it — and 🐊**Putout** calls `os.homedir()`
 * at module scope, which throws in a browser bundle before React mounts. The
 * mcp imports it from `@putout/editor-commands/plugin`, the subpath that costs
 * the same import and is only paid by a consumer that compiles a plugin.
 *
 * `runFind`, `runTransform` and `runValidate` are gone for the same reason as
 * `compilePlugin`, and the registry reaches them through a dynamic `import()`
 * in `commands/index.ts` — see the note there. A consumer that wants one
 * imports it from its own file:
 * `@putout/editor-commands/commands/validate`.
 */
export {runAst} from './commands/ast.ts';
export {runSource} from './commands/source.ts';
export {runTestPattern} from './commands/test-pattern.ts';
export {runNamePattern} from './commands/name-pattern.ts';
export {runHelp} from './commands/help.ts';
export {runClear} from './commands/clear.ts';
export {runReset} from './commands/reset.ts';
export {runConsole} from './commands/console.ts';
