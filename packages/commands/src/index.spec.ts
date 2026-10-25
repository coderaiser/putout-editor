import {test} from 'supertape';
import * as api from './index.ts';

const isString = (a: unknown): a is string => typeof a === 'string';

test('index: exports the commands, the ast tools and the tree components', (t) => {
    const expected: string[] = [
        'commands',
        'compactAST',
        'curriculum',
        'errorText',
        'findLearnNode',
        'flattenAst',
        'flattenLearn',
        'learnNodes',
        'needsPutout',
        'notInBrowser',
        'parseCommand',
        'queryAST',
        'runAst',
        'runClear',
        'runConsole',
        'runHelp',
        'runLearn',
        'runNamePattern',
        'runReset',
        'runSource',
        'runTestPattern',
        'text',
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

/**
 * The barrel must stay free of React. This package is a Node library — the mcp
 * uses the commands and has no DOM — so a component exported here would put
 * React and `@testing-library` into every Node consumer's graph. The tree lives
 * in `packages/chat/src/components/`; this asserts it has not come back.
 */
test('index: exports no React component', (t) => {
    const components = Object
        .keys(api)
        .filter((name) => /^(Ast|use)/.test(name));
    
    const expected: string[] = [];
    
    t.deepEqual(components, expected);
    t.end();
});

/**
 * `curriculum` is exported for the browser, so its module has to stay pure.
 *
 * `packages/chat` imports this barrel, and the note at the top of the file is
 * about one specific failure: a value whose module calls `createRequire` or
 * `os.homedir()` at scope throws before React mounts, and the page renders
 * nothing. `compilePlugin` is out for that reason. `curriculum` is in for the
 * opposite one — it is a data literal.
 *
 * This asserts the property rather than trusting the file to stay that way: an
 * import added to `curriculum.ts` tomorrow would otherwise be discovered by a
 * blank page.
 */
test('index: curriculum is a plain tree, with nothing to import', (t) => {
    const [root] = api.curriculum;
    
    const result = {
        isArray: Array.isArray(api.curriculum),
        hasId: isString(root.id),
        hasChildren: Array.isArray(root.children),
    };
    
    const expected = {
        isArray: true,
        hasId: true,
        hasChildren: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The three learn helpers are re-exported rather than reached by deep path.
 *
 * `packages/chat` renders the tree and `packages/mcp` answers `learn_node`; both
 * import `@putout/editor-commands`. A deep subpath would work and would make
 * each consumer name a file inside this package, which is the coupling the
 * barrel exists to prevent.
 */
test('index: exports the learn helpers the chat and the mcp both use', (t) => {
    const result = [
        typeof api.flattenLearn,
        typeof api.findLearnNode,
        typeof api.learnNodes,
        typeof api.runLearn,
    ];
    
    const expected = [
        'function',
        'function',
        'function',
        'function',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});
