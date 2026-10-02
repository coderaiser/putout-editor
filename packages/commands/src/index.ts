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
export {default as AstTree} from './components/AstTree.tsx';
export {default as AstRow} from './components/AstRow.tsx';
export {default as AstSearch} from './components/AstSearch.tsx';
export {default as AstCodePreview} from './components/AstCodePreview.tsx';
export {default as AstStatus} from './components/AstStatus.tsx';
export {
    useTreeState,
    filterNodes,
    visibleRows,
    rowsOf,
    withAncestors,
    defaultCollapsed,
} from './components/useTreeState.ts';

/**
 * `runFind`, `runTransform` and `runValidate` are not re-exported here for the
 * same reason `compilePlugin` is not: each reaches 🐊**Putout**, so a barrel
 * export puts it back in the graph for every consumer. The registry reaches them
 * through a dynamic `import()` in `commands/index.ts`, which is what keeps them
 * in a chunk the page never loads — see the note there.
 *
 * A consumer that wants one imports it from its own file:
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
