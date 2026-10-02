import {test} from 'supertape';
import * as api from './index.ts';

test('index: exports the commands, the ast tools and the tree components', (t) => {
    const expected: string[] = [
        'AstCodePreview',
        'AstRow',
        'AstSearch',
        'AstStatus',
        'AstTree',
        'commands',
        'compactAST',
        'defaultCollapsed',
        'errorText',
        'filterNodes',
        'flattenAst',
        'needsPutout',
        'notInBrowser',
        'parseCommand',
        'queryAST',
        'rowsOf',
        'runAst',
        'runClear',
        'runConsole',
        'runHelp',
        'runNamePattern',
        'runReset',
        'runSource',
        'runTestPattern',
        'text',
        'useTreeState',
        'visibleRows',
        'withAncestors',
    ];
    
    const result = Object
        .keys(api)
        .sort();
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The barrel must not re-export `compilePlugin`. It is a value whose module calls
 * `createRequire(import.meta.url)` at the top level, which pulls `redput` and
 * 🐊**Putout** into any consumer that imports this file — and 🐊**Putout** calls
 * `os.homedir()` at module scope, so a browser bundle of it throws before
 * React mounts. `packages/chat` imports this file for the parser and the tree
 * alone and rendered nothing until the export came out.
 *
 * The subpath `@putout/editor-commands/plugin` still has it, which is what the
 * mcp uses. Asserting the absence here is what stops it being "helpfully" added
 * back, and the comment is what stops it being added without reading this.
 */
test('index: does not re-export compilePlugin, which drags in putout', (t) => {
    const result = 'compilePlugin' in api;
    
    t.notOk(result);
    t.end();
});
